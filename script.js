/**
 * MosamCheck — Weather Dashboard Script
 * Features: Search Suggestions · Unit Toggle (C/F, kph/mph)
 *           Dynamic SEO · Staggered Animations · Accessibility
 */

'use strict';

/* ==========================================================
   CONFIGURATION
   ========================================================== */
const API_KEY = "f26451880dec4cf0a3d142457260704";

/* Local city overrides for cities not in Nominatim */
const LOCAL_CITIES = {
    "garh more":     { lat: 30.846, lon: 71.845, name: "Garh More",     country: "Pakistan" },
    "garh maharaja": { lat: 30.833, lon: 71.905, name: "Garh Maharaja", country: "Pakistan" },
    "g m raja":      { lat: 30.833, lon: 71.905, name: "Garh Maharaja", country: "Pakistan" }
};

/* ==========================================================
   STATE
   ========================================================== */
let currentUnit      = 'C';    // 'C' | 'F'
let currentSpeedUnit = 'kph';  // 'kph' | 'mph'
let lastWeatherData  = null;   // cache for unit re-renders
let debounceTimer    = null;

/* ==========================================================
   DOM REFERENCES
   ========================================================== */
const themeSwitch        = document.getElementById("themeSwitch");
const cityInput          = document.getElementById("cityInput");
const clearBtn           = document.getElementById("clearBtn");
const currentLocBtn      = document.getElementById("currentLocBtn");
const dashboard          = document.getElementById("weatherDashboard");
const loadingEl          = document.getElementById("loading");
const errorEl            = document.getElementById("error");
const forecastContainer  = document.getElementById("forecastContainer");
const hourlyContainer    = document.getElementById("hourlyContainer");
const suggestionsEl      = document.getElementById("searchSuggestions");
const celsiusBtn         = document.getElementById("celsiusBtn");
const fahrenheitBtn      = document.getElementById("fahrenheitBtn");
const kphBtn             = document.getElementById("kphBtn");
const mphBtn             = document.getElementById("mphBtn");

/* ==========================================================
   THEME TOGGLE
   ========================================================== */
themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", themeSwitch.checked);
});

/* ==========================================================
   UNIT TOGGLES
   ========================================================== */
function activateUnitBtn(activeBtn, inactiveBtn, newUnit, type) {
    if (type === 'temp') currentUnit      = newUnit;
    else                 currentSpeedUnit = newUnit;

    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-pressed", "true");
    inactiveBtn.classList.remove("active");
    inactiveBtn.setAttribute("aria-pressed", "false");

    if (lastWeatherData) renderUI(lastWeatherData);
}

celsiusBtn.addEventListener("click",   () => activateUnitBtn(celsiusBtn,    fahrenheitBtn, 'C',   'temp'));
fahrenheitBtn.addEventListener("click",() => activateUnitBtn(fahrenheitBtn, celsiusBtn,    'F',   'temp'));
kphBtn.addEventListener("click",       () => activateUnitBtn(kphBtn,        mphBtn,        'kph', 'speed'));
mphBtn.addEventListener("click",       () => activateUnitBtn(mphBtn,        kphBtn,        'mph', 'speed'));

/* ==========================================================
   UNIT CONVERSION HELPERS
   ========================================================== */
function toTemp(celsius) {
    return currentUnit === 'F'
        ? Math.round((celsius * 9 / 5) + 32)
        : Math.round(celsius);
}

function tempUnit() { return currentUnit === 'F' ? '°F' : '°C'; }

function toSpeed(kph) {
    return currentSpeedUnit === 'mph'
        ? Math.round(kph * 0.621371)
        : Math.round(kph);
}

function speedUnit() { return currentSpeedUnit === 'mph' ? 'mph' : 'km/h'; }

/* ==========================================================
   SEARCH — CLEAR BUTTON
   ========================================================== */
cityInput.addEventListener("input", () => {
    const val = cityInput.value.trim();
    clearBtn.classList.toggle("hidden", val.length === 0);

    if (val.length < 2) { hideSuggestions(); return; }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(val), 380);
});

clearBtn.addEventListener("click", () => {
    cityInput.value = '';
    clearBtn.classList.add("hidden");
    hideSuggestions();
    cityInput.focus();
});

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        hideSuggestions();
        fetchCoordinates(cityInput.value.trim());
    }
    if (e.key === "Escape") hideSuggestions();
});

/* ==========================================================
   SEARCH SUGGESTIONS (Nominatim API)
   ========================================================== */
async function fetchSuggestions(query) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&featuretype=city&addressdetails=1`;
        const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!res.ok) return;
        const data = await res.json();
        renderSuggestions(data);
    } catch {
        hideSuggestions();
    }
}

function renderSuggestions(results) {
    if (!results.length) { hideSuggestions(); return; }

    suggestionsEl.innerHTML = '';

    results.forEach((r, idx) => {
        const parts   = r.display_name.split(",");
        const city    = parts[0].trim();
        const country = parts[parts.length - 1].trim();
        const label   = `${city}, ${country}`;

        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.setAttribute("role", "option");
        item.setAttribute("tabindex", "0");
        item.setAttribute("id", `suggestion-${idx}`);
        item.textContent = label;

        const selectThis = () => {
            cityInput.value = city;
            clearBtn.classList.remove("hidden");
            hideSuggestions();
            fetchWeather(parseFloat(r.lat), parseFloat(r.lon), city, country);
        };

        item.addEventListener("click", selectThis);
        item.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectThis(); }
        });

        suggestionsEl.appendChild(item);
    });

    suggestionsEl.classList.remove("hidden");
    cityInput.setAttribute("aria-expanded", "true");
}

function hideSuggestions() {
    suggestionsEl.classList.add("hidden");
    suggestionsEl.innerHTML = '';
    cityInput.setAttribute("aria-expanded", "false");
}

/* Close on outside click */
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) hideSuggestions();
});

/* ==========================================================
   LOCATION & FETCHING
   ========================================================== */
function loadUserLocation() {
    hideAll();
    showLoading();

    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser. Please search for a city manually.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Your Location", ""),
        (err) => {
            const msgs = {
                1: "Location access was denied. Please search for a city manually.",
                2: "Location unavailable. Please search for a city.",
                3: "Location request timed out. Please try again."
            };
            showError(msgs[err.code] || "Could not get your location.");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
}

async function fetchCoordinates(city) {
    if (!city) return;
    hideAll();
    showLoading();

    const localKey = city.toLowerCase();
    if (LOCAL_CITIES[localKey]) {
        const { lat, lon, name, country } = LOCAL_CITIES[localKey];
        return fetchWeather(lat, lon, name, country);
    }

    try {
        const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
        const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();

        if (!data.length) throw new Error(`"${city}" not found. Try a different spelling or add the country name.`);

        const parts   = data[0].display_name.split(",");
        const name    = parts[0].trim();
        const country = parts[parts.length - 1].trim();
        await fetchWeather(parseFloat(data[0].lat), parseFloat(data[0].lon), name, country);
    } catch (err) {
        showError(err.message);
    }
}

async function fetchWeather(lat, lon, name, country) {
    try {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=no`;
        const res = await fetch(url);

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.message || "Weather service is temporarily unavailable. Please try again.");
        }

        const data = await res.json();
        lastWeatherData = data;
        renderUI(data);
    } catch (err) {
        showError(err.message);
    }
}

/* ==========================================================
   RENDER UI
   ========================================================== */
function renderUI(data) {
    const current     = data.current;
    const forecastDays = data.forecast.forecastday;
    const loc         = data.location;

    /* Dynamic background & forced dark/light per day/night */
    setDynamicBackground(current.condition.code, current.is_day);

    /* SEO meta */
    updateMetaTags(loc.name, loc.country, current);

    /* Location & timestamp */
    document.getElementById("location").textContent = `${loc.name}, ${loc.country}`;
    const now = new Date();
    document.getElementById("updateTime").textContent =
        `Updated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    /* Temperature */
    document.getElementById("temperature").textContent  = `${toTemp(current.temp_c)}${tempUnit()}`;
    document.getElementById("feelsLike").textContent    = `${toTemp(current.feelslike_c)}${tempUnit()}`;

    /* Astro */
    document.getElementById("sunrise").textContent = forecastDays[0].astro.sunrise;
    document.getElementById("sunset").textContent  = forecastDays[0].astro.sunset;

    /* Icon & Condition */
    const cond   = getWeatherCondition(current.condition.code, current.is_day);
    const iconEl = document.getElementById("weatherIcon");
    iconEl.textContent = cond.icon;
    iconEl.setAttribute("aria-label", `Weather icon: ${current.condition.text}`);
    document.getElementById("condition").textContent = current.condition.text;

    /* Metrics */
    document.getElementById("humidity").textContent = `${current.humidity}%`;
    document.getElementById("wind").textContent     = `${toSpeed(current.wind_kph)} ${speedUnit()}`;
    document.getElementById("pressure").textContent = `${(current.pressure_mb * 0.02953).toFixed(2)} in`;
    document.getElementById("uv").textContent       = current.uv;

    /* 12-Hour Forecast */
    renderHourly(forecastDays);

    /* 7-Day Forecast */
    renderWeekly(forecastDays);

    /* Show dashboard */
    loadingEl.classList.add("hidden");
    dashboard.classList.remove("hidden");

    /* Staggered card animations */
    animateCards();
}

/* ----- 12-Hour Forecast ----- */
function renderHourly(forecastDays) {
    hourlyContainer.innerHTML = '';

    const combined    = [...forecastDays[0].hour, ...forecastDays[1].hour];
    const currentHour = new Date().getHours();

    for (let i = currentHour; i < currentHour + 12; i++) {
        const h = combined[i];
        if (!h) continue;

        const hCond  = getWeatherCondition(h.condition.code, h.is_day);
        const timeStr = new Date(h.time).toLocaleTimeString([], { hour: 'numeric', hour12: true });
        const rainPct = h.chance_of_rain;

        const card = document.createElement("article");
        card.className = "hourly-card glass-card card-animate";
        card.setAttribute("role", "listitem");
        card.setAttribute("aria-label", `${timeStr}: ${Math.round(h.temp_c)}°C, ${h.condition.text}`);

        card.innerHTML = `
            <span class="time">${timeStr}</span>
            <span class="icon" aria-hidden="true">${hCond.icon}</span>
            <span class="temp">${toTemp(h.temp_c)}${tempUnit()}</span>
            ${rainPct > 0 ? `<span class="rain-chance" title="${rainPct}% chance of rain">🌂 ${rainPct}%</span>` : `<span class="rain-chance" style="opacity:0">-</span>`}
        `;

        hourlyContainer.appendChild(card);
    }
}

/* ----- 7-Day Forecast ----- */
function renderWeekly(forecastDays) {
    forecastContainer.innerHTML = '';

    forecastDays.forEach((day, index) => {
        const cond    = getWeatherCondition(day.day.condition.code, 1);
        const dayName = index === 0
            ? "Today"
            : new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const card = document.createElement("article");
        card.className = "forecast-card glass-card card-animate";
        card.setAttribute("role", "listitem");
        card.setAttribute("aria-label",
            `${dayName}: ${day.day.condition.text}, high ${Math.round(day.day.maxtemp_c)}°C, low ${Math.round(day.day.mintemp_c)}°C`);

        card.innerHTML = `
            <div class="card-header">
                <span class="day-name">${dayName}</span>
                <span class="card-date">${dateStr}</span>
            </div>
            <div class="card-status">
                <span class="large-icon" aria-hidden="true">${cond.icon}</span>
                <p class="condition-desc">${day.day.condition.text}</p>
            </div>
            <div class="card-metrics-footer">
                <div class="footer-item">
                    <span class="footer-label">High</span>
                    <span class="footer-value high-temp">${toTemp(day.day.maxtemp_c)}${tempUnit()}</span>
                </div>
                <div class="footer-item">
                    <span class="footer-label">Rain</span>
                    <span class="footer-value">${day.day.daily_chance_of_rain}%</span>
                </div>
                <div class="footer-item">
                    <span class="footer-label">Low</span>
                    <span class="footer-value low-temp">${toTemp(day.day.mintemp_c)}${tempUnit()}</span>
                </div>
            </div>
        `;

        forecastContainer.appendChild(card);
    });
}

/* ==========================================================
   STAGGERED CARD ANIMATIONS
   ========================================================== */
function animateCards() {
    requestAnimationFrame(() => {
        const cards = document.querySelectorAll('.card-animate');
        cards.forEach((card, i) => {
            setTimeout(() => {
                card.classList.add("visible");
            }, i * 55);
        });
    });
}

/* ==========================================================
   WEATHER CONDITION MAPPER
   ========================================================== */
function getWeatherCondition(code, isDay) {
    const dayIcon   = isDay ? "☀️"  : "🌙";
    const cloudIcon = isDay ? "⛅" : "☁️";

    if (code === 1000) return { icon: dayIcon };
    if (code === 1003) return { icon: cloudIcon };
    if ([1006, 1009].includes(code))
        return { icon: "☁️" };
    if ([1030, 1135, 1147].includes(code))
        return { icon: "🌫️" };
    if ([1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code))
        return { icon: "🌧️" };
    if ([1198, 1201].includes(code))
        return { icon: "🌨️" };
    if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code))
        return { icon: "❄️" };
    if ([1087, 1273, 1276, 1279, 1282].includes(code))
        return { icon: "⛈️" };
    return { icon: "🌥️" };
}

/* ==========================================================
   DYNAMIC BACKGROUND
   ========================================================== */
function setDynamicBackground(code, isDay) {
    let type = "clouds";

    if (code === 1000) type = "clear";
    else if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code))
        type = "rain";
    else if ([1087, 1273, 1276, 1279, 1282].includes(code))
        type = "thunder";
    else if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225].includes(code))
        type = "snow";

    document.body.setAttribute("data-weather", type);

    /* Force theme by time of day */
    const isDark = isDay === 0;
    document.body.classList.toggle("dark-mode", isDark);
    themeSwitch.checked = isDark;
}

/* ==========================================================
   DYNAMIC SEO META TAGS
   ========================================================== */
function updateMetaTags(city, country, current) {
    const temp  = Math.round(current.temp_c);
    const cond  = current.condition.text;
    const hum   = current.humidity;
    const wind  = Math.round(current.wind_kph);

    const title = `Weather in ${city}, ${country} — ${temp}°C, ${cond} | MosamCheck`;
    const desc  = `Live weather in ${city}: ${temp}°C, ${cond}. Humidity ${hum}%, Wind ${wind} km/h. Get hourly and 7-day forecasts on MosamCheck.`;

    document.getElementById("pageTitle").textContent = title;
    setMeta("description", desc);
    setMeta("og:title",    title, true);
    setMeta("og:description", desc, true);
}

function setMeta(name, content, isProperty = false) {
    const attr = isProperty ? `[property="${name}"]` : `[name="${name}"]`;
    const el   = document.querySelector(`meta${attr}`);
    if (el) el.setAttribute("content", content);
}

/* ==========================================================
   UI STATE HELPERS
   ========================================================== */
function showLoading() {
    loadingEl.classList.remove("hidden");
}

function showError(msg) {
    loadingEl.classList.add("hidden");
    errorEl.innerHTML = `<strong>⚠️ Oops!</strong> ${escapeHTML(msg)}`;
    errorEl.classList.remove("hidden");
}

function hideAll() {
    errorEl.classList.add("hidden");
    dashboard.classList.add("hidden");
    loadingEl.classList.add("hidden");
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* ==========================================================
   INIT
   ========================================================== */
window.addEventListener("load", loadUserLocation);
currentLocBtn.addEventListener("click", loadUserLocation);

/* Footer year */
const yearSpan = document.getElementById("currentYear");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

/* URL query param support: mosamcheck.me/?q=Lahore */
(function checkQueryParam() {
    const params = new URLSearchParams(window.location.search);
    const q      = params.get("q");
    if (q) {
        setTimeout(() => fetchCoordinates(q), 500);
    }
})();