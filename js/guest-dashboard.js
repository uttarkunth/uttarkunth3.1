/**
 * UTTARKUNTH GUEST DASHBOARD CONTROLLER
 * Powers /trips, /saved, /profile and WhatsApp support bridge.
 */
(function (root) {
  "use strict";

  async function loadTrips() {
    var list = document.getElementById("guest-trips-list");
    if (!list) return;

    if (!window.UKAuth || !window.UKAuth.getUser()) {
      list.innerHTML = `
        <div style="text-align:center;padding:48px;background:var(--surface);border-radius:14px;border:1px solid var(--line);">
          <h3>Sign in to view your trips</h3>
          <p style="color:var(--muted);margin:12px 0 20px;">Follow your booking requests, arrival details and check-in instructions.</p>
          <button class="btn-primary" onclick="window.openAuthModal('signin')">Sign In / Register</button>
        </div>
      `;
      return;
    }

    list.innerHTML = `<p style="padding:24px;text-align:center;color:var(--muted);">Loading your mountain trips...</p>`;

    try {
      var res = await fetch("/api/guest/bookings", {
        headers: { "Authorization": "Bearer " + window.UKAuth.getBearerToken() }
      });
      var data = await res.json();
      var bookings = data.bookings || [];

      if (!bookings.length) {
        list.innerHTML = `
          <div style="text-align:center;padding:48px;background:var(--surface);border-radius:14px;border:1px solid var(--line);">
            <h3>No trips requested yet</h3>
            <p style="color:var(--muted);margin:12px 0 20px;">Explore authentic Himalayan homestays in Kullu, Tirthan and Parvati valley.</p>
            <a class="btn-primary" href="/stays">Explore Stays</a>
          </div>
        `;
        return;
      }

      list.innerHTML = bookings.map(function (b) {
        var isPending = b.status === "pending";
        var isConfirmed = b.status === "confirmed";
        var statusBadge = isPending 
          ? `<span style="background:#FEF3C7;color:#B45309;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;">⏳ Awaiting Host Approval</span>`
          : isConfirmed 
            ? `<span style="background:#DCFCE7;color:#15803D;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;">✓ Confirmed by Host</span>`
            : `<span style="background:#FEE2E2;color:#B91C1C;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;">${b.status}</span>`;

        var cancelBtn = isPending
          ? `<button class="btn-ghost" style="color:var(--danger);border-color:var(--danger);padding:6px 14px;font-size:12px;" onclick="window.GuestDashboard.cancelBooking('${b.id}')">Cancel Request</button>`
          : "";

        var supportMsg = encodeURIComponent(`Hello Uttarkunth Support, I need assistance with my booking ${b.booking_reference} for ${b.property?.name || 'Homestay'}.`);
        var whatsappBtn = `<a href="https://wa.me/918627025502?text=${supportMsg}" target="_blank" class="btn-ghost" style="padding:6px 14px;font-size:12px;color:var(--pine);">WhatsApp Support</a>`;

        return `
          <div style="background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:24px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
              <div>
                <span style="font-size:12px;font-family:var(--mono);color:var(--muted);">${b.booking_reference}</span>
                <h3 style="font-size:1.3rem;margin-top:4px;">${b.property?.name || 'Himalayan Homestay'}</h3>
                <p style="font-size:13px;color:var(--muted);">${b.property?.location || ''} · ${b.room_name || 'Room'}</p>
              </div>
              <div>${statusBadge}</div>
            </div>
            <div style="display:flex;gap:32px;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:16px 0;font-size:14px;">
              <div><small style="color:var(--muted);display:block;">CHECK-IN</small><strong>${b.check_in}</strong></div>
              <div><small style="color:var(--muted);display:block;">CHECK-OUT</small><strong>${b.check_out}</strong></div>
              <div><small style="color:var(--muted);display:block;">GUESTS</small><strong>${b.adults} Adults, ${b.children} Children</strong></div>
              <div><small style="color:var(--muted);display:block;">ESTIMATED TOTAL</small><strong style="color:var(--terracotta);">₹${Number(b.total_estimate).toLocaleString("en-IN")}</strong></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;color:var(--stone);">Payable on arrival directly to host. No online charge.</span>
              <div style="display:flex;gap:10px;">
                ${whatsappBtn}
                ${cancelBtn}
              </div>
            </div>
          </div>
        `;
      }).join("");
    } catch (e) {
      list.innerHTML = `<p style="padding:24px;color:var(--danger);">Could not load your trips. Please try again.</p>`;
    }
  }

  async function cancelBooking(id) {
    var reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;

    try {
      var res = await fetch("/api/guest/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + window.UKAuth.getBearerToken()
        },
        body: JSON.stringify({ action: "cancel", booking_id: id, reason: reason })
      });
      if (res.ok) {
        alert("Booking request cancelled successfully.");
        loadTrips();
      } else {
        alert("Could not cancel booking.");
      }
    } catch (_) {
      alert("Error cancelling booking.");
    }
  }

  async function loadSaved() {
    var container = document.getElementById("guest-saved-list");
    if (!container) return;
    container.innerHTML = `<p style="padding:24px;text-align:center;color:var(--muted);">Saved stays will appear here.</p>`;
  }

  root.GuestDashboard = {
    loadTrips: loadTrips,
    cancelBooking: cancelBooking,
    loadSaved: loadSaved
  };
})(typeof window !== "undefined" ? window : this);
