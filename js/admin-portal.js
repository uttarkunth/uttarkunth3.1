/**
 * UTTARKUNTH CURATOR DESK CONTROLLER
 * Platform administration, listing moderation & host assignment.
 */
(function () {
  "use strict";

  async function init() {
    var token = window.UKAuth ? window.UKAuth.getBearerToken() : "";
    if (!token) {
      document.getElementById("admin-login-prompt")?.removeAttribute("hidden");
      document.getElementById("admin-dashboard-view")?.setAttribute("hidden", "true");
      return;
    }

    try {
      var res = await fetch("/api/admin/bookings", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.status === 401 || res.status === 403) {
        document.getElementById("admin-login-prompt")?.removeAttribute("hidden");
        document.getElementById("admin-dashboard-view")?.setAttribute("hidden", "true");
        return;
      }
      var data = await res.json();
      renderAdmin(data);
    } catch (e) {
      console.error("Could not load admin workspace:", e);
    }
  }

  function renderAdmin(data) {
    document.getElementById("admin-login-prompt")?.setAttribute("hidden", "true");
    document.getElementById("admin-dashboard-view")?.removeAttribute("hidden");

    var bookings = data.bookings || [];
    var hostless = bookings.filter(b => !b.host_id || b.needs_assignment);

    var list = document.getElementById("admin-queue-list");
    if (list) {
      if (!bookings.length) {
        list.innerHTML = `<p style="padding:24px;text-align:center;color:var(--muted);background:var(--surface);border-radius:12px;border:1px solid var(--line);">All homestays operating smoothly. No pending actions.</p>`;
      } else {
        list.innerHTML = bookings.map(function (b) {
          return `
            <div class="queue-card">
              <div class="queue-details">
                <span class="editorial-label">${b.property_name || 'Property'} · ${b.status}</span>
                <strong>Guest: ${b.guest_name} (${b.guest_phone || 'No phone'})</strong>
                <p>Dates: ${b.check_in} → ${b.check_out} · Total: ₹${Number(b.total_estimate).toLocaleString("en-IN")}</p>
              </div>
              <div class="queue-actions">
                ${b.status === 'pending' ? `
                  <button class="btn-accept" onclick="window.AdminPortal.decide('${b.id}', 'approve')">Admin Approve</button>
                  <button class="btn-decline" onclick="window.AdminPortal.decide('${b.id}', 'decline')">Admin Decline</button>
                ` : `<span>${b.status}</span>`}
              </div>
            </div>
          `;
        }).join("");
      }
    }
  }

  async function decide(id, action) {
    var reason = prompt("Enter administrative reason/note:");
    if (!reason) return;
    var token = window.UKAuth ? window.UKAuth.getBearerToken() : "";

    try {
      var res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ action: action, booking_id: id, reason: reason })
      });
      if (res.ok) {
        alert("Action saved successfully.");
        init();
      } else {
        alert("Could not process admin action.");
      }
    } catch (_) {
      alert("Error contacting admin service.");
    }
  }

  window.AdminPortal = {
    init: init,
    decide: decide
  };

  document.addEventListener("DOMContentLoaded", init);
})();
