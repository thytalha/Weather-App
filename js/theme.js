/**
 * MosamCheck — Theme Controller
 * Handles dark/light mode toggle, persistence, and syncing with particle/sound engines.
 */

"use strict";

const THEME_KEY = "mosamcheck_theme_preference";

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const isDark = savedTheme === "light" ? false : true;
  document.body.classList.toggle("dark-mode", isDark);
  if (themeSwitch) themeSwitch.checked = isDark;
  if (typeof weatherParticles !== "undefined" && weatherParticles) {
    weatherParticles.isDay = !isDark;
    weatherParticles.initParticles();
  }
}

if (themeSwitch) {
  themeSwitch.addEventListener("change", () => {
    const isDark = themeSwitch.checked;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    if (typeof weatherParticles !== "undefined" && weatherParticles) {
      weatherParticles.isDay = !isDark;
      weatherParticles.initParticles();
    }
  });
}

initTheme();
