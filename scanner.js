const params = new URLSearchParams(window.location.search);
const tier = params.get("tier") || "Unknown";
const ticketId = params.get("id") || "----";
const guestName = params.get("name") || "Guest";
const attendeeStorageKey = "smartScanAttendees";

document.getElementById("nameDisplay").textContent = guestName;
document.getElementById("tierDisplay").textContent = tier;
document.getElementById("idDisplay").textContent = ticketId;

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function getTicketRegistration() {
  let attendees;
  try {
    attendees = JSON.parse(localStorage.getItem(attendeeStorageKey) || "[]");
  } catch {
    return null;
  }

  if (!Array.isArray(attendees)) return null;
  const matchingIds = attendees.filter((attendee) => String(attendee.id) === ticketId);
  if (matchingIds.length !== 1) return null;

  const registration = matchingIds[0];
  if (typeof registration.name !== "string"
      || normalizeName(registration.name) !== normalizeName(guestName)
      || registration.tier !== tier) {
    return null;
  }

  return { attendees, registration };
}

function authorizeEntry() {
  const statusBox = document.getElementById("statusBox");
  const button = document.getElementById("authorizeBtn");
  const ticket = getTicketRegistration();
  const lastDigit = Number.parseInt(ticketId.slice(-1), 10);
  const isEven = Number.isInteger(lastDigit) && lastDigit % 2 === 0;

  statusBox.classList.remove(
    "idle", "granted", "denied", "override", "pulse-green", "shake"
  );

  if (!ticket) {
    statusBox.classList.add("denied", "shake");
    statusBox.textContent = "Access Denied: Ticket Details Do Not Match a Registration";
  } else if (ticket.registration.usedAt) {
    statusBox.classList.add("denied", "shake");
    statusBox.textContent = "Access Denied: This Ticket Has Already Been Used";
  } else if (tier === "Backstage" || isEven) {
    ticket.registration.usedAt = new Date().toISOString();
    try {
      localStorage.setItem(attendeeStorageKey, JSON.stringify(ticket.attendees));
      statusBox.classList.add(tier === "Backstage" ? "override" : "granted", "pulse-green");
      statusBox.textContent = tier === "Backstage"
        ? `Access Granted: VIP Override for ${guestName}`
        : `Access Granted: ${guestName}, ${tier} Section`;
    } catch {
      delete ticket.registration.usedAt;
      statusBox.classList.add("denied", "shake");
      statusBox.textContent = "Access Denied: Could Not Verify Ticket Use";
    }
  } else {
    statusBox.classList.add("denied", "shake");
    statusBox.textContent = "Access Denied: Ticket Invalid";
  }

  button.disabled = true;
  button.textContent = "Scan Complete";
}