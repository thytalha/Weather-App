/**
 * MosamCheck — Unit Toggles & Conversion Helpers
 * Handles switching between Celsius (°C) and Fahrenheit (°F), km/h and mph.
 */

"use strict";

function activateUnitBtn(activeBtn, inactiveBtn, newUnit, type) {
  if (type === "temp") currentUnit = newUnit;
  else currentSpeedUnit = newUnit;
  activeBtn.classList.add("active");
  activeBtn.setAttribute("aria-pressed", "true");
  inactiveBtn.classList.remove("active");
  inactiveBtn.setAttribute("aria-pressed", "false");
  if (lastWeatherData && typeof renderUI === "function") {
    renderUI(lastWeatherData);
  }
}

if (celsiusBtn && fahrenheitBtn) {
  celsiusBtn.addEventListener("click", () =>
    activateUnitBtn(celsiusBtn, fahrenheitBtn, "C", "temp"),
  );
  fahrenheitBtn.addEventListener("click", () =>
    activateUnitBtn(fahrenheitBtn, celsiusBtn, "F", "temp"),
  );
}

if (kphBtn && mphBtn) {
  kphBtn.addEventListener("click", () =>
    activateUnitBtn(kphBtn, mphBtn, "kph", "speed"),
  );
  mphBtn.addEventListener("click", () =>
    activateUnitBtn(mphBtn, kphBtn, "mph", "speed"),
  );
}

function toTemp(celsius) {
  return currentUnit === "F"
    ? Math.round((celsius * 9) / 5 + 32)
    : Math.round(celsius);
}

function tempUnit() {
  return currentUnit === "F" ? "°F" : "°C";
}

function toSpeed(kph) {
  return currentSpeedUnit === "mph"
    ? Math.round(kph * 0.621371)
    : Math.round(kph);
}

function speedUnit() {
  return currentSpeedUnit === "mph" ? "mph" : "km/h";
}
