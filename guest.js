// ============================================================
// Smart-Scan Kiosk — guest.js
// Runs on guest.html. Reads the tier passed from the booking
// terminal, takes the attendee's name, generates the ticket ID,
// and hands tier + id + name to scanner.html.
// ============================================================

const params = new URLSearchParams(window.location.search);
const tier = params.get("tier") || "Standard";

const tierBadge = document.getElementById("tierBadge");
const guestForm = document.getElementById("guestForm");
const guestNameInput = document.getElementById("guestName");
const guestError = document.getElementById("guestError");
const generateButton = guestForm.querySelector('button[type="submit"]');

const ticketPreview = document.getElementById("ticketPreview");
const previewName = document.getElementById("previewName");
const previewTier = document.getElementById("previewTier");
const previewId = document.getElementById("previewId");
const proceedBtn = document.getElementById("proceedBtn");
const attendeeStorageKey = "smartScanAttendees";

tierBadge.textContent = tier;

let currentTicketId = null;

function getRegisteredAttendees() {
  try {
    const attendees = JSON.parse(localStorage.getItem(attendeeStorageKey) || "[]");
    return Array.isArray(attendees) ? attendees : [];
  } catch {
    return [];
  }
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function nameIsRegistered(name, attendees) {
  const normalizedName = normalizeName(name);
  return attendees.some((attendee) =>
    typeof attendee.name === "string" && normalizeName(attendee.name) === normalizedName
  );
}

function createUniqueTicketId(attendees) {
  const existingIds = new Set(attendees.map((attendee) => String(attendee.id)));
  for (let attempt = 0; attempt < 9000; attempt += 1) {
    const ticketId = Math.floor(Math.random() * 9000) + 1000;
    if (!existingIds.has(String(ticketId))) return ticketId;
  }
  return null;
}

function showNameError(message) {
  guestError.textContent = message;
  guestError.hidden = false;
}

guestNameInput.addEventListener("input", () => {
  guestError.hidden = true;
});

guestForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = guestNameInput.value.trim().replace(/\s+/g, " ");
  if (!name) return;
  const attendees = getRegisteredAttendees();
  if (nameIsRegistered(name, attendees)) {
    showNameError("This name already has a registered ticket. Please check the attendee list.");
    return;
  }

  guestNameInput.value = name;
  guestError.hidden = true;

  currentTicketId = createUniqueTicketId(attendees);
  if (currentTicketId === null) {
    showNameError("No unique ticket IDs are available. Please contact the event organizer.");
    return;
  }

  previewName.textContent = name;
  previewTier.textContent = tier;
  previewId.textContent = currentTicketId;

  ticketPreview.hidden = false;
  ticketPreview.dataset.tier = tier;
  generateButton.disabled = true;
  generateButton.textContent = "Ticket Created";
});

proceedBtn.addEventListener("click", () => {
  if (!currentTicketId || proceedBtn.disabled) return;

  const name = previewName.textContent;
  const attendees = getRegisteredAttendees();
  if (nameIsRegistered(name, attendees)) {
    currentTicketId = null;
    ticketPreview.hidden = true;
    generateButton.disabled = false;
    generateButton.textContent = "Generate Ticket";
    guestNameInput.value = "";
    guestNameInput.focus();
    showNameError("This name already has a registered ticket. Please use a different name.");
    return;
  }

  if (attendees.some((attendee) => String(attendee.id) === String(currentTicketId))) {
    currentTicketId = createUniqueTicketId(attendees);
    if (currentTicketId === null) {
      showNameError("No unique ticket IDs are available. Please contact the event organizer.");
      return;
    }
    previewId.textContent = currentTicketId;
  }

  attendees.unshift({
    id: String(currentTicketId),
    name,
    tier,
    registeredAt: new Date().toISOString()
  });
  try {
    localStorage.setItem(attendeeStorageKey, JSON.stringify(attendees));
  } catch {
    showNameError("Could not save the ticket on this device. Please try again.");
    return;
  }

  proceedBtn.disabled = true;
  proceedBtn.textContent = "Opening Scanner...";

  const scannerUrl = new URL("scanner.html", window.location.href);
  scannerUrl.searchParams.set("tier", tier);
  scannerUrl.searchParams.set("id", currentTicketId);
  scannerUrl.searchParams.set("name", name);
  window.location.href = scannerUrl.href;
});