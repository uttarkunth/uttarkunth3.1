/**
 * UTTARKUNTH HOST DESK CONTROLLER
 * Simple, village-friendly homestay management.
 */
(function () {
  "use strict";

  async function init() {
    var token = window.UKAuth ? window.UKAuth.getBearerToken() : "";
    if (!token) {
      document.getElementById("host-login-prompt")?.removeAttribute("hidden");
      document.getElementById("host-dashboard-view")?.setAttribute("hidden", "true");
      return;
    }

    try {
      var res = await fetch("/api/host", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.status === 401 || res.status === 403) {
        document.getElementById("host-login-prompt")?.removeAttribute("hidden");
        document.getElementById("host-dashboard-view")?.setAttribute("hidden", "true");
        return;
      }
      var data = await res.json();
      renderDashboard(data);
    } catch (e) {
      console.error("Could not load host dashboard:", e);
    }
  }

  function renderDashboard(data) {
    document.getElementById("host-login-prompt")?.setAttribute("hidden", "true");
    document.getElementById("host-dashboard-view")?.removeAttribute("hidden");

    var host = data.host || {};
    var properties = data.properties || [];
    var bookings = data.bookings || [];

    // User chip
    var userEl = document.getElementById("host-user-display");
    if (userEl) userEl.textContent = host.email || "Verified Host";

    // Metrics
    var pending = bookings.filter(b => b.status === "pending");
    var confirmed = bookings.filter(b => b.status === "confirmed");

    var mPending = document.getElementById("m-pending-count");
    if (mPending) mPending.textContent = pending.length;
    var mConfirmed = document.getElementById("m-confirmed-count");
    if (mConfirmed) mConfirmed.textContent = confirmed.length;

    // Queue list
    var queueList = document.getElementById("host-queue-list");
    if (queueList) {
      if (!pending.length) {
        queueList.innerHTML = `<p style="padding:24px;text-align:center;color:var(--muted);background:var(--surface);border-radius:12px;border:1px solid var(--line);">No pending booking requests right now.</p>`;
      } else {
        queueList.innerHTML = pending.map(function (b) {
          return `
            <div class="queue-card">
              <div class="queue-details">
                <strong>${b.guest_name} · ${b.adults} Adults, ${b.children} Children</strong>
                <p>Dates: <strong>${b.check_in} → ${b.check_out}</strong> · Room: ${b.room_name || 'Assigned Room'}</p>
                <p>Estimated Payout: <strong style="color:var(--terracotta);">₹${Number(b.total_estimate).toLocaleString("en-IN")}</strong> (Payable on arrival)</p>
                ${b.special_requests ? `<p style="font-style:italic;color:var(--muted);margin-top:6px;">"${b.special_requests}"</p>` : ""}
              </div>
              <div class="queue-actions">
                <button class="btn-accept" onclick="window.HostPortal.decideBooking('${b.id}', 'confirmed')">Accept Stay</button>
                <button class="btn-decline" onclick="window.HostPortal.decideBooking('${b.id}', 'declined')">Decline</button>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  }

  async function decideBooking(id, status) {
    var notes = status === "declined" ? prompt("Optional reason for declining:") : "";
    var token = window.UKAuth ? window.UKAuth.getBearerToken() : "";

    try {
      var res = await fetch("/api/host", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ booking_id: id, status: status, host_notes: notes || "" })
      });
      if (res.ok) {
        alert(status === "confirmed" ? "Booking confirmed! Calendar locked." : "Booking declined. Dates released.");
        init();
      } else {
        var err = await res.json();
        alert(err.error || "Could not save decision.");
      }
    } catch (_) {
      alert("Error contacting host service.");
    }
  }

  window.HostPortal = {
    init: init,
    decideBooking: decideBooking
  };

  document.addEventListener("DOMContentLoaded", init);
})();
