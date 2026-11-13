/**
 * UTTARKUNTH SUPABASE CLIENT SDK
 * Standardized for Supabase Auth on Cloudflare Pages.
 * Uses only public anon key; secrets are strictly server-side.
 */
(function (root) {
  "use strict";

  // Production Supabase project config (xyplgugxpmlnjsvlosdg)
  var CONFIG = {
    url: window.UTTARKUNTH_SUPABASE_URL || "https://xyplgugxpmlnjsvlosdg.supabase.co",
    anonKey: window.UTTARKUNTH_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGxndWd4cG1sbmpzdmxvc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk1NDk2NzQsImV4cCI6MjA0NTEyNTY3NH0.KjB5qY3HjS5u8Z9cQ2YF4L8uG8oE8fK6J7wX1Z9mN3Y"
  };

  var STORAGE_KEY = "uk_auth_session_v1";

  function getSession() {
    try {
      var item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch (_) {
      return null;
    }
  }

  function setSession(session) {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      triggerAuthChange(session ? session.user : null);
    } catch (_) {}
  }

  var authListeners = [];
  function onAuthStateChange(callback) {
    if (typeof callback === "function") {
      authListeners.push(callback);
      var current = getSession();
      callback(current ? current.user : null);
    }
  }

  function triggerAuthChange(user) {
    authListeners.forEach(function (fn) { fn(user); });
  }

  async function authRequest(endpoint, body) {
    var response = await fetch(CONFIG.url + "/auth/v1/" + endpoint, {
      method: "POST",
      headers: {
        "apikey": CONFIG.anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    var data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || data.error_description || data.message || "Authentication failed");
    }
    return data;
  }

  var client = {
    config: CONFIG,
    getSession: getSession,
    getUser: function () {
      var s = getSession();
      return s ? s.user : null;
    },
    getBearerToken: function () {
      var s = getSession();
      return s ? s.access_token : "";
    },
    signInWithPassword: async function (email, password) {
      var res = await authRequest("token?grant_type=password", { email: email, password: password });
      setSession(res);
      return res;
    },
    signUp: async function (email, password, metadata) {
      var res = await authRequest("signup", { email: email, password: password, data: metadata });
      if (res.session) setSession(res.session);
      return res;
    },
    signInWithOtp: async function (email) {
      return await authRequest("otp", {
        email: email,
        create_user: true,
        options: { emailRedirectTo: window.location.origin + "/trips" }
      });
    },
    signOut: async function () {
      try {
        var token = client.getBearerToken();
        if (token) {
          fetch(CONFIG.url + "/auth/v1/logout", {
            method: "POST",
            headers: { "apikey": CONFIG.anonKey, "Authorization": "Bearer " + token }
          }).catch(function () {});
        }
      } catch (_) {}
      setSession(null);
    },
    onAuthStateChange: onAuthStateChange
  };

  root.UKAuth = client;
})(typeof window !== "undefined" ? window : this);
