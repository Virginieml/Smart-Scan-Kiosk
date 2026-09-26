const attendeeStorageKey = "smartScanAttendees";
const attendeeRows = document.getElementById("attendeeRows");
const attendeeEmpty = document.getElementById("attendeeEmpty");
const searchInput = document.getElementById("attendeeSearch");
const tierFilter = document.getElementById("tierFilter");
const tiers = ["Standard", "VIP", "Backstage"];

function getAttendees() {
  try {
    const attendees = JSON.parse(localStorage.getItem(attendeeStorageKey) || "[]");
    return Array.isArray(attendees) ? attendees : [];
  } catch {
    return [];
  }
}

function renderAttendees() {
  const attendees = getAttendees();
  const query = searchInput.value.trim().toLowerCase();
  const selectedTier = tierFilter.value;
  const visibleAttendees = attendees.filter((attendee) => {
    const matchesQuery = `${attendee.name} ${attendee.id}`.toLowerCase().includes(query);
    const matchesTier = selectedTier === "all" || attendee.tier === selectedTier;
    return matchesQuery && matchesTier;
  });

  document.getElementById("totalCount").textContent = attendees.length;
  for (const tier of tiers) {
    const count = attendees.filter((attendee) => attendee.tier === tier).length;
    document.getElementById(`${tier.toLowerCase()}Count`).textContent = count;
  }

  attendeeRows.replaceChildren();
  for (const attendee of visibleAttendees) {
    const row = document.createElement("tr");
    const registeredDate = new Date(attendee.registeredAt);
    const registeredText = Number.isNaN(registeredDate.getTime())
      ? "—"
      : registeredDate.toLocaleString();

    for (const value of [attendee.name, attendee.id, attendee.tier, registeredText]) {
      const cell = document.createElement("td");
      cell.textContent = value || "—";
      row.append(cell);
    }
    attendeeRows.append(row);
  }

  attendeeEmpty.hidden = visibleAttendees.length > 0;
  attendeeEmpty.textContent = attendees.length === 0
    ? "No registered tickets yet."
    : "No attendees match your search.";
}

searchInput.addEventListener("input", renderAttendees);
tierFilter.addEventListener("change", renderAttendees);
renderAttendees();