/**
 * MosamCheck — UI Helper Functions
 * Includes ripple effect, loading/error screens, HTML escaping, and SEO meta updates.
 */

"use strict";

function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const wave = document.createElement("span");
  wave.classList.add("ripple-wave");
  wave.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
    `;
  btn.appendChild(wave);
  wave.addEventListener("animationend", () => wave.remove());
}

document.querySelectorAll(".ripple-btn, .unit-btn, .loc-btn").forEach((btn) => {
  btn.addEventListener("click", addRipple);
});

function showLoading() {
  if (loadingEl) loadingEl.classList.remove("hidden");
}

function showError(msg) {
  if (loadingEl) loadingEl.classList.add("hidden");
  if (errorEl) {
    errorEl.innerHTML = `<strong>⚠️ Oops!</strong> ${escapeHTML(msg)}`;
    errorEl.classList.remove("hidden");
  }
}

function hideAll() {
  if (errorEl) errorEl.classList.add("hidden");
  if (dashboard) dashboard.classList.add("hidden");
  if (loadingEl) loadingEl.classList.add("hidden");
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function updateMetaTags(city, country, current) {
  const temp = Math.round(current.temp_c);
  const cond = current.condition.text;
  const title = `Weather in ${city}, ${country} — ${temp}°C, ${cond} | MosamCheck`;
  const desc = `Live weather in ${city}: ${temp}°C, ${cond}. Humidity ${current.humidity}%, Wind ${Math.round(current.wind_kph)} km/h.`;
  const pageTitleEl = document.getElementById("pageTitle");
  if (pageTitleEl) pageTitleEl.textContent = title;
  setMeta("description", desc);
  setMeta("og:title", title, true);
  setMeta("og:description", desc, true);
}

function setMeta(name, content, isProperty = false) {
  const attr = isProperty ? `[property="${name}"]` : `[name="${name}"]`;
  const el = document.querySelector(`meta${attr}`);
  if (el) el.setAttribute("content", content);
}

function uvCategory(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}
