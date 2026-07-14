/**
 * MosamCheck — Search & Geocoding Controller
 * Handles city search input, debounce suggestions, OpenStreetMap Nominatim queries, and recent selection.
 */

"use strict";

if (cityInput && clearBtn) {
  cityInput.addEventListener("input", () => {
    const val = cityInput.value.trim();
    clearBtn.classList.toggle("hidden", val.length === 0);
    if (val.length < 2) {
      hideSuggestions();
      return;
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(val), 380);
  });

  clearBtn.addEventListener("click", () => {
    cityInput.value = "";
    clearBtn.classList.add("hidden");
    hideSuggestions();
    cityInput.focus();
  });

  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      hideSuggestions();
      fetchCoordinates(cityInput.value.trim());
    }
    if (e.key === "Escape") {
      hideSuggestions();
    }
  });
}

async function fetchSuggestions(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&featuretype=city&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return;
    renderSuggestions(await res.json());
  } catch {
    hideSuggestions();
  }
}

function renderSuggestions(results) {
  if (!suggestionsEl) return;
  if (!results.length) {
    hideSuggestions();
    return;
  }
  suggestionsEl.innerHTML = "";
  results.forEach((r, idx) => {
    const parts = r.display_name.split(",");
    const city = parts[0].trim();
    const country = parts[parts.length - 1].trim();
    const label = `${city}, ${country}`;

    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.setAttribute("role", "option");
    item.setAttribute("tabindex", "0");
    item.setAttribute("id", `suggestion-${idx}`);
    item.textContent = label;

    const pick = () => {
      cityInput.value = city;
      clearBtn.classList.remove("hidden");
      hideSuggestions();
      fetchWeather(parseFloat(r.lat), parseFloat(r.lon), city, country);
    };

    item.addEventListener("click", pick);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick();
      }
    });
    suggestionsEl.appendChild(item);
  });
  suggestionsEl.classList.remove("hidden");
  if (cityInput) cityInput.setAttribute("aria-expanded", "true");
}

function hideSuggestions() {
  if (!suggestionsEl) return;
  suggestionsEl.classList.add("hidden");
  suggestionsEl.innerHTML = "";
  if (cityInput) cityInput.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) hideSuggestions();
});
