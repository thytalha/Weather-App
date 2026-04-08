const API_KEY = "f26451880dec4cf0a3d142457260704"; 

const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");
});

const cityInput = document.getElementById("cityInput");
const currentLocBtn = document.getElementById("currentLocBtn");
const dashboard = document.getElementById("weatherDashboard");
const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const forecastContainer = document.getElementById("forecastContainer");
const hourlyContainer = document.getElementById("hourlyContainer");

const localCities = {
    "garh more": { lat: 30.846, lon: 71.845, name: "Garh More", country: "Pakistan" },
    "garh maharaja": { lat: 30.833, lon: 71.905, name: "Garh Maharaja", country: "Pakistan" },
    "g m raja": { lat: 30.833, lon: 71.905, name: "Garh Maharaja", country: "Pakistan" }
};

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") fetchCoordinates(cityInput.value.trim());
});

function loadUserLocation() {
    hideAll();
    loading.classList.remove("hidden");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Your Location", ""),
            () => showError("Please search for a city manually."),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
}

window.addEventListener("load", loadUserLocation);
currentLocBtn.addEventListener("click", loadUserLocation);

async function fetchCoordinates(city) {
    if (!city) return;
    hideAll();
    loading.classList.remove("hidden");
    const query = city.toLowerCase();
    if (localCities[query]) {
        return fetchWeather(localCities[query].lat, localCities[query].lon, localCities[query].name, localCities[query].country);
    }
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
        const data = await res.json();
        if (!data.length) throw new Error("City not found.");
        const parts = data[0].display_name.split(",");
        fetchWeather(parseFloat(data[0].lat), parseFloat(data[0].lon), parts[0], parts[parts.length - 1]);
    } catch (err) { showError(err.message); }
}

async function fetchWeather(lat, lon, name, country) {
    try {
        const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=no`);
        if (!res.ok) throw new Error("Weather service unavailable.");
        updateUI(await res.json(), name, country);
    } catch (err) { showError(err.message); }
}

function updateUI(data, name, country) {
    const current = data.current;
    const forecastDays = data.forecast.forecastday;

    setDynamicBackground(current.condition.code, current.is_day);

    document.getElementById("location").textContent = `${data.location.name}, ${data.location.country}`;
    document.getElementById("temperature").textContent = `${Math.round(current.temp_c)}°C`;
    document.getElementById("sunrise").textContent = forecastDays[0].astro.sunrise;
    document.getElementById("sunset").textContent = forecastDays[0].astro.sunset;

    const condition = getWeatherCondition(current.condition.code, current.is_day);
    document.getElementById("weatherIcon").textContent = condition.icon;
    document.getElementById("condition").textContent = current.condition.text;

    document.getElementById("humidity").textContent = `${current.humidity}%`;
    document.getElementById("wind").textContent = `${current.wind_kph} Km/h`;
    document.getElementById("pressure").textContent = `${(current.pressure_mb * 0.02953).toFixed(2)} Inch`;
    document.getElementById("uv").textContent = current.uv;

    // 12-Hour Logic
    hourlyContainer.innerHTML = ""; 
    const combinedHours = [...forecastDays[0].hour, ...forecastDays[1].hour];
    const now = new Date().getHours();
    for (let i = now; i < now + 12; i++) {
        const h = combinedHours[i];
        const hCond = getWeatherCondition(h.condition.code, h.is_day);
        const div = document.createElement("div");
        div.className = "hourly-card";
        div.innerHTML = `<span class="time">${new Date(h.time).toLocaleTimeString([], { hour: 'numeric' })}</span>
                         <span class="icon">${hCond.icon}</span>
                         <span class="temp">${Math.round(h.temp_c)}°C</span>`;
        hourlyContainer.appendChild(div);
    }

    // 7-Day Logic
    forecastContainer.innerHTML = ""; 
    forecastDays.forEach((day, index) => {
        const cond = getWeatherCondition(day.day.condition.code, 1);
        const div = document.createElement("div");
        div.className = "forecast-card";
        div.innerHTML = `
            <div class="card-header"><span class="day-name">${index === 0 ? "Today" : new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</span></div>
            <div class="card-status"><span class="large-icon">${cond.icon}</span><p>${day.day.condition.text}</p></div>
            <div class="card-metrics-footer">
                <div class="footer-item"><span class="label">Max</span><span class="value">${Math.round(day.day.maxtemp_c)}°C</span></div>
                <div class="footer-item"><span class="label">Rain</span><span class="value">${day.day.daily_chance_of_rain}%</span></div>
                <div class="footer-item"><span class="label">Min</span><span class="value">${Math.round(day.day.mintemp_c)}°C</span></div>
            </div>`;
        forecastContainer.appendChild(div);
    });

    loading.classList.add("hidden");
    dashboard.classList.remove("hidden");
}

function getWeatherCondition(code, isDay) {
    const sun = isDay ? "☀️" : "🌙";
    if (code === 1000) return { icon: sun, text: "Clear" };
    if ([1003, 1006, 1009].includes(code)) return { icon: isDay ? "⛅" : "☁️", text: "Cloudy" };
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return { icon: "🌧️", text: "Rain" };
    if ([1087, 1273, 1276, 1279, 1282].includes(code)) return { icon: "⛈️", text: "Thunder" };
    return { icon: "🌥️", text: "Overcast" };
}

function setDynamicBackground(code, isDay) {
    let type = "clouds"; 
    if (code === 1000) type = "clear";
    else if ([1063, 1180, 1240].includes(code)) type = "rain";
    else if ([1087, 1273].includes(code)) type = "thunder";
    document.body.setAttribute("data-weather", type);

    // Force theme based on Day/Night
    if (isDay === 0) {
        document.body.classList.add("dark-mode");
        themeSwitch.checked = true;
    } else {
        document.body.classList.remove("dark-mode");
        themeSwitch.checked = false;
    }
}

function showError(msg) { loading.classList.add("hidden"); errorDiv.textContent = msg; errorDiv.classList.remove("hidden"); }
function hideAll() { errorDiv.classList.add("hidden"); dashboard.classList.add("hidden"); }

// --- FOOTER DYNAMIC YEAR ---
const yearSpan = document.getElementById("currentYear");
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}