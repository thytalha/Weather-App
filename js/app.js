/**
 * MosamCheck — Application Bootstrap & Main Entry Point
 * Initializes startup event listeners, user geolocation request, URL query handling, and footer details.
 */

"use strict";

window.addEventListener("load", () => {
  if (typeof loadUserLocation === "function") {
    loadUserLocation();
  }
});

if (currentLocBtn) {
  currentLocBtn.addEventListener("click", () => {
    if (typeof loadUserLocation === "function") {
      loadUserLocation();
    }
  });
}

/* Footer year update */
const yearEl = document.getElementById("currentYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* URL query param auto-load: e.g., ?q=Lahore */
(function checkQueryParam() {
  const q = new URLSearchParams(window.location.search).get("q");
  if (q && typeof fetchCoordinates === "function") {
    setTimeout(() => fetchCoordinates(q), 500);
  }
})();
