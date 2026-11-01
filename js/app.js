/**
 * UTTARKUNTH CLIENT ROUTER & APPLICATION CONTROLLER
 * Clean URL SPA routing on Cloudflare Pages edge.
 */
(function () {
  "use strict";

  // Navigation route table
  var VIEWS = ["home", "stays", "stay-detail", "production", "about", "contact", "trips", "saved", "profile"];

  function parsePath() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "") return { view: "home" };
    if (path === "/stays") return { view: "stays" };
    if (path.indexOf("/stays/") === 0) {
      return { view: "stay-detail", slug: path.replace("/stays/", "") };
    }
    if (path === "/production") return { view: "production" };
    if (path === "/about") return { view: "about" };
    if (path === "/contact") return { view: "contact" };
    if (path === "/trips") return { view: "trips" };
    if (path === "/saved") return { view: "saved" };
    if (path === "/profile") return { view: "profile" };
    return { view: "home" };
  }

  function renderView(route) {
    // Hide all view containers
    VIEWS.forEach(function (v) {
      var el = document.getElementById("view-" + v);
      if (el) el.hidden = true;
    });

    // Show active view
    var activeEl = document.getElementById("view-" + route.view);
    if (activeEl) {
      activeEl.hidden = false;
      window.scrollTo(0, 0);
    }

    // Toggle dedicated headers: Stays header vs Global homepage header
    var mainHeader = document.getElementById("main-header");
    var staysHeader = document.getElementById("stays-header");
    var isStaysSection = ["stays", "stay-detail", "trips", "saved", "profile"].indexOf(route.view) > -1;

    if (mainHeader && staysHeader) {
      mainHeader.hidden = isStaysSection;
      staysHeader.hidden = !isStaysSection;
    }

    // Initialize module-specific data
    if (route.view === "stays" && window.StaysEngine) {
      window.StaysEngine.loadDiscovery();
    } else if (route.view === "stay-detail" && window.StaysEngine) {
      window.StaysEngine.loadPropertyDetail(route.slug);
    } else if (route.view === "trips" && window.GuestDashboard) {
      window.GuestDashboard.loadTrips();
    } else if (route.view === "saved" && window.GuestDashboard) {
      window.GuestDashboard.loadSaved();
    }
  }

  function navigate(path) {
    window.history.pushState({}, "", path);
    renderView(parsePath());
  }

  // Intercept standard clean URL clicks
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || !a.href) return;
    
    // Ignore external links, mailto, tel, host/admin portals
    if (a.origin !== window.location.origin) return;
    if (a.pathname.indexOf("/host") === 0 || a.pathname.indexOf("/admin") === 0) return;
    if (a.getAttribute("target") === "_blank") return;
    if (a.hasAttribute("download")) return;

    // Handle smooth in-page hash scroll
    if (a.getAttribute("href").indexOf("#") === 0) {
      e.preventDefault();
      var targetId = a.getAttribute("href").substring(1);
      var targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    e.preventDefault();
    navigate(a.pathname);
  });

  window.addEventListener("popstate", function () {
    renderView(parsePath());
  });

  // Auth modal management
  window.openAuthModal = function (mode) {
    var modal = document.getElementById("auth-modal");
    if (modal) modal.classList.add("active");
  };

  window.closeAuthModal = function () {
    var modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("active");
  };

  // Auth state listener
  if (window.UKAuth) {
    window.UKAuth.onAuthStateChange(function (user) {
      var authButtons = document.querySelectorAll(".btn-auth");
      authButtons.forEach(function (btn) {
        if (user) {
          btn.textContent = user.email ? user.email.split("@")[0] : "Account";
          btn.onclick = function () { navigate("/profile"); };
        } else {
          btn.textContent = "Sign In";
          btn.onclick = function () { window.openAuthModal("signin"); };
        }
      });
    });
  }

  // Interactive scroll animations for Question & Framework timeline
  function initHomeInteractions() {
    var q = document.getElementById("qt");
    if (q && !q.dataset.split) {
      q.dataset.split = "true";
      q.innerHTML = q.textContent.trim().split(/\s+/).map(function (w) {
        return '<span class="w">' + w + '</span>';
      }).join(' ');
    }

    var ws = q ? q.querySelectorAll(".w") : [];
    var fw = document.getElementById("fw");
    var tb = document.getElementById("tb");

    function onScroll() {
      if (q && ws.length) {
        var vh = window.innerHeight;
        var r = q.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.55)));
        ws.forEach(function (w, i) {
          w.classList.toggle("on", i / ws.length <= p);
        });
      }

      if (fw && tb) {
        var vh2 = window.innerHeight;
        var f = fw.getBoundingClientRect();
        var progress = Math.min(1, Math.max(0, (vh2 * 0.6 - f.top) / f.height));
        tb.style.height = (progress * 100) + "%";
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  // Initial load
  document.addEventListener("DOMContentLoaded", function () {
    renderView(parsePath());
    initHomeInteractions();
  });

  window.UKRouter = { navigate: navigate };
})();
