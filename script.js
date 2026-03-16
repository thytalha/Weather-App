const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");
});

const cityInput = document.getElementById("cityInput");
const currentLocBtn = document.getElementById("currentLocBtn");
const dashboard = document.getElementById("weatherDashboard");
const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error");

// New Containers
const forecastContainer = document.getElementById("forecastContainer");
const hourlyContainer = document.getElementById("hourlyContainer");

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        fetchCoordinates(cityInput.value.trim());
    }
});

function loadUserLocation() {
    hideAll();
    loading.classList.remove("hidden");

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                try {
                    const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                    const geoData = await geoRes.json();
                    
                    const city = geoData.city || geoData.locality || "Unknown Location";
                    const country = geoData.countryName || "";
                    
                    fetchWeather(lat, lon, city, country);
                } catch (err) {
                    fetchWeather(lat, lon, "Your Location", "");
                }
            },
            (err) => {
                fetchCoordinates("Lahore");
            }
        );
    } else {
        fetchCoordinates("Lahore");
    }
}

window.addEventListener("load", loadUserLocation);
currentLocBtn.addEventListener("click", loadUserLocation);

async function fetchCoordinates(city) {
    if (!city) return;
    hideAll();
    loading.classList.remove("hidden");

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        fetchWeather(latitude, longitude, name, country);
    } catch (err) {
        showError(err.message);
    }
}

async function fetchWeather(lat, lon, name, country) {
    try {
        // Fetching Current, Hourly (24h), and Daily (7d) data
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
        
        const weatherRes = await fetch(url);
        const data = await weatherRes.json();

        updateUI(data, name, country);
    } catch (err) {
        showError("Failed to fetch weather data.");
    }
}

function updateUI(data, name, country) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    // 1. Update Main Location & Current Temp
    const sunriseObj = new Date(daily.sunrise[0]);
    const sunsetObj = new Date(daily.sunset[0]);
    const sunriseStr = sunriseObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetStr = sunsetObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    document.getElementById("location").textContent = country ? `${name}, ${country}` : name;
    document.getElementById("temperature").textContent = `${current.temperature_2m}°C`;
    document.getElementById("sunrise").textContent = sunriseStr;
    document.getElementById("sunset").textContent = sunsetStr;
    
    const conditionInfo = getWeatherCondition(current.weather_code, current.is_day);
    document.getElementById("weatherIcon").textContent = conditionInfo.icon;
    document.getElementById("condition").textContent = conditionInfo.text;

    document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
    document.getElementById("wind").textContent = `${current.wind_speed_10m} Km/h`;
    
    const pressureInches = (current.surface_pressure * 0.02953).toFixed(2);
    document.getElementById("pressure").textContent = `${pressureInches} Inch`;
    document.getElementById("uv").textContent = daily.uv_index_max[0];

    // 2. Update Hourly Forecast (Next 24 Hours)
    hourlyContainer.innerHTML = ""; // Clear existing
    const currentHourIdx = new Date().getHours();
    for (let i = currentHourIdx; i < currentHourIdx + 24; i++) {
        const time = new Date(hourly.time[i]);
        const displayTime = time.toLocaleTimeString([], { hour: 'numeric' });
        const temp = Math.round(hourly.temperature_2m[i]);
        const condition = getWeatherCondition(hourly.weather_code[i], 1);

        const hourCard = document.createElement("div");
        hourCard.className = "hourly-card";
        hourCard.innerHTML = `
            <span class="time">${displayTime}</span>
            <span class="icon">${condition.icon}</span>
            <span class="temp">${temp}°C</span>
        `;
        hourlyContainer.appendChild(hourCard);
    }

    // 3. Update 7-Day Forecast
    forecastContainer.innerHTML = ""; // Clear existing
    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short' });
        const condition = getWeatherCondition(daily.weather_code[i], 1);

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <span class="day">${dayName}</span>
            <span class="icon">${condition.icon}</span>
            <span class="temp-max">${Math.round(daily.temperature_2m_max[i])}°C</span>
            <span class="temp-min">${Math.round(daily.temperature_2m_min[i])}°C</span>
        `;
        forecastContainer.appendChild(card);
    }

    loading.classList.add("hidden");
    dashboard.classList.remove("hidden");
}

function showError(msg) {
    loading.classList.add("hidden");
    dashboard.classList.add("hidden");
    errorDiv.textContent = msg;
    errorDiv.classList.remove("hidden");
}

function hideAll() {
    errorDiv.classList.add("hidden");
    dashboard.classList.add("hidden");
}

function getWeatherCondition(code, isDay) {
    const icon = isDay ? "☀️" : "🌙";
    const cloudIcon = isDay ? "⛅" : "☁️🌙";

    if (code === 0) return { icon: icon, text: "Clear" };
    if (code >= 1 && code <= 3) return { icon: cloudIcon, text: "Partly cloudy" };
    if (code === 45 || code === 48) return { icon: "🌫️", text: "Fog" };
    if (code >= 51 && code <= 67) return { icon: "🌧️", text: "Rain" };
    if (code >= 71 && code <= 77) return { icon: "❄️", text: "Snow" };
    if (code >= 80 && code <= 82) return { icon: "🌧️", text: "Rain showers" };
    if (code >= 85 && code <= 86) return { icon: "❄️", text: "Snow showers" };
    if (code >= 95 && code <= 99) return { icon: "⛈️", text: "Thunderstorm" };
    return { icon: "☁️", text: "Overcast" };
}