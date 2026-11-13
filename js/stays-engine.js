/**
 * UTTARKUNTH STAYS ENGINE
 * Powers /stays discovery & the Stay in Bharat-inspired property page.
 */
(function (root) {
  "use strict";

  // Verified property fallback records (matches Supabase database)
  var VERIFIED_STAYS = [
    {
      id: "3c62cf64-b0d7-4148-8df0-7d35ef6f6f96",
      slug: "yash-home-stay",
      name: "Yash Home Stay",
      village: "Jari",
      district: "Kullu",
      state: "Himachal Pradesh",
      address: "Jari, Parvati Valley, Kullu, Himachal Pradesh 175105",
      description: "Authentic Kath-Kuni wooden residence handcrafted using deodar cedar and Himalayan stone. Nestled amidst old apple orchards with views of misty mountain ridges.",
      from_price: 3500,
      photos: [
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
      ],
      rooms: [
        { id: "room-yash-1", room_name: "Cedar Wood Suite", max_guests: 3, base_price: 3500, description: "Spacious wooden attic suite with double bed, attached hot-water bath, and valley balcony." },
        { id: "room-yash-2", room_name: "Valley View Room", max_guests: 2, base_price: 2800, description: "Cozy pine room with panoramic mountain views and traditional wood heater." }
      ],
      amenities: ["Free WiFi", "Free Parking", "Home-Cooked Food", "Mountain View", "Camp Fire", "Room Service"],
      host: { name: "Yashwant", title: "Verified Host", response: "Within 1 hour", languages: "Hindi, English" },
      coords: { lat: 32.0125, lng: 77.2458 }
    },
    {
      id: "a0bebeeb-0fe5-46b3-9eb3-97fb34b65dd0",
      slug: "wonderway-retreat",
      name: "Wonderway Retreat",
      village: "Gushaini",
      district: "Tirthan Valley",
      state: "Himachal Pradesh",
      address: "Gushaini, Tirthan Valley, Kullu, Himachal Pradesh 175123",
      description: "Quiet riverside mountain retreat on the threshold of the Great Himalayan National Park. Crystal spring water, trout fishing trails, and unpolluted star-filled skies.",
      from_price: 4200,
      photos: [
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80"
      ],
      rooms: [
        { id: "room-wonder-1", room_name: "Riverside Cedar Room", max_guests: 2, base_price: 4200, description: "Front-facing balcony over the river stream with stone fireplace." }
      ],
      amenities: ["Free WiFi", "Riverside Walk", "Organic Breakfast", "Bonfire", "Power Backup"],
      host: { name: "Arvind", title: "Verified Host", response: "Within 1 hour", languages: "Hindi, English" },
      coords: { lat: 31.6421, lng: 77.4128 }
    }
  ];

  async function loadDiscovery() {
    var grid = document.getElementById("featured-stays-grid");
    if (!grid) return;

    // Attempt live fetch from Cloudflare Pages Function
    var stays = VERIFIED_STAYS;
    try {
      var res = await fetch("/api/stays/search");
      if (res.ok) {
        var json = await res.json();
        if (json.results && json.results.length) stays = json.results;
      }
    } catch (_) {}

    grid.innerHTML = stays.map(function (s) {
      return `
        <a class="stay-card" href="/stays/${s.slug}">
          <div class="stay-card-img-wrap">
            <img class="stay-card-img" src="${s.photos[0]}" alt="${s.name}" loading="lazy">
            <span class="stay-badge-top-left">★ 4.96 (Verified)</span>
            <span class="stay-badge-top-right">Village Homestay</span>
          </div>
          <div class="stay-card-body">
            <span class="stay-card-loc">📍 ${s.village}, ${s.district}</span>
            <h3 class="stay-card-title">${s.name}</h3>
            <p class="stay-card-desc">${s.description ? s.description.substring(0, 92) + '...' : 'Traditional Kath-Kuni wooden architecture with organic mountain meals and warm village hospitality.'}</p>
            <div class="stay-card-footer">
              <div class="stay-card-price">₹${Number(s.from_price).toLocaleString("en-IN")} <small>/ night</small></div>
              <span class="stay-card-cta">Explore Stay →</span>
            </div>
          </div>
        </a>
      `;
    }).join("");
  }

  function loadPropertyDetail(slug) {
    var stay = VERIFIED_STAYS.find(function (s) { return s.slug === slug; }) || VERIFIED_STAYS[0];
    
    // Fill text & titles
    var nameEl = document.getElementById("detail-stay-name");
    if (nameEl) nameEl.textContent = stay.name;
    var locEl = document.getElementById("detail-stay-location");
    if (locEl) locEl.textContent = stay.address;
    var descEl = document.getElementById("detail-stay-desc");
    if (descEl) descEl.textContent = stay.description;

    // Gallery (Up to 8 photos)
    var galleryEl = document.getElementById("detail-stay-gallery");
    if (galleryEl) {
      galleryEl.innerHTML = stay.photos.slice(0, 8).map(function (src) {
        return `<img src="${src}" alt="${stay.name}" loading="lazy">`;
      }).join("");
    }

    // Room Selection Matrix
    var roomsEl = document.getElementById("detail-rooms-list");
    if (roomsEl) {
      roomsEl.innerHTML = stay.rooms.map(function (rm, idx) {
        return `
          <div class="room-matrix-card">
            <div>
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                <input type="radio" name="selected_room" value="${rm.id}" data-price="${rm.base_price}" ${idx === 0 ? "checked" : ""}>
                <strong style="font-size:1.15rem;">${rm.room_name}</strong>
              </label>
              <p style="font-size:13px;color:var(--muted);margin:6px 0 10px;">Sleeps ${rm.max_guests} Guests · Attached Bathroom · Hot Water</p>
              <p style="font-size:14px;color:var(--stone);">${rm.description || ""}</p>
              <div style="font-size:12px;color:var(--success);margin-top:10px;font-weight:600;">✓ Free cancellation up to 24h before check-in · Pay ₹0 now</div>
            </div>
            <div class="room-matrix-price">
              <h3>₹${Number(rm.base_price).toLocaleString("en-IN")}</h3>
              <span style="font-size:12px;color:var(--muted);">per night</span>
            </div>
          </div>
        `;
      }).join("");
    }

    // Attach Price Calculation & Booking Listeners
    setupBookingWidget(stay);
  }

  function setupBookingWidget(stay) {
    var inDate = document.getElementById("book-checkin");
    var outDate = document.getElementById("book-checkout");
    var totalEl = document.getElementById("book-total-calc");
    var submitBtn = document.getElementById("btn-submit-booking-request");
    var statusMsg = document.getElementById("booking-status-msg");

    var today = new Date().toISOString().slice(0, 10);
    if (inDate) inDate.min = today;
    if (outDate) outDate.min = today;

    function recalculate() {
      if (!inDate || !outDate || !totalEl) return;
      var cIn = inDate.value, cOut = outDate.value;
      if (!cIn || !cOut || cIn >= cOut) {
        totalEl.textContent = "Select dates to calculate";
        return;
      }
      var nights = Math.round((Date.parse(cOut) - Date.parse(cIn)) / 86400000);
      var checkedRoom = document.querySelector('input[name="selected_room"]:checked');
      var price = checkedRoom ? Number(checkedRoom.dataset.price) : stay.from_price;
      var total = price * nights;
      totalEl.textContent = `₹${price.toLocaleString("en-IN")} × ${nights} nights = ₹${total.toLocaleString("en-IN")}`;
    }

    if (inDate) inDate.addEventListener("change", recalculate);
    if (outDate) outDate.addEventListener("change", recalculate);
    document.querySelectorAll('input[name="selected_room"]').forEach(function (r) {
      r.addEventListener("change", recalculate);
    });

    if (submitBtn) {
      submitBtn.onclick = async function () {
        if (!window.UKAuth || !window.UKAuth.getUser()) {
          window.openAuthModal("signin");
          return;
        }

        var checkedRoom = document.querySelector('input[name="selected_room"]:checked');
        var payload = {
          room_unit_id: checkedRoom ? checkedRoom.value : stay.rooms[0].id,
          check_in: inDate ? inDate.value : "",
          check_out: outDate ? outDate.value : "",
          adults: Number(document.getElementById("book-adults")?.value || 2),
          children: Number(document.getElementById("book-children")?.value || 0),
          guest_name: document.getElementById("book-guest-name")?.value || window.UKAuth.getUser().email,
          guest_phone: document.getElementById("book-guest-phone")?.value || "",
          special_requests: document.getElementById("book-guest-notes")?.value || ""
        };

        if (!payload.check_in || !payload.check_out || payload.check_in >= payload.check_out) {
          alert("Please select valid check-in and check-out dates.");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting Request...";

        try {
          var res = await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + window.UKAuth.getBearerToken()
            },
            body: JSON.stringify(payload)
          });
          var data = await res.json();
          if (res.ok) {
            alert(`Booking request sent! Reference: ${data.booking_reference}. You can track this in My Trips.`);
            window.UKRouter.navigate("/trips");
          } else {
            alert(data.error || "Booking request could not be saved.");
          }
        } catch (err) {
          alert("Could not connect to booking server. Please try again.");
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = "Request to Book";
        }
      };
    }
  }

  root.StaysEngine = {
    loadDiscovery: loadDiscovery,
    loadPropertyDetail: loadPropertyDetail
  };
})(typeof window !== "undefined" ? window : this);
