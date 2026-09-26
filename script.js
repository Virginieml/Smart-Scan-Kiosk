function generateTicket(tier) {
  const guestUrl = new URL('guest.html', window.location.href);
  guestUrl.searchParams.set('tier', tier);
  window.location.href = guestUrl.href;
}