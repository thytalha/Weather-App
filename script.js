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

// Custom Dictionary for local abbreviations
const localCities = {
    "garh more": { lat: 30.846, lon: 71.845, name: "Garh More", country: "Pakistan" },
    "garh maharaja": { lat: 30.833, lon: 71.905, name: "Garh Maharaja", country: "Pakistan" },
    "g m raja": { lat: 30.833, lon: 71.905, name: "Garh Maharaja", country: "Pakistan" }
};

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
                fetchWeather(lat, lon, "Your Location", "");
            },
            (err) => {
                showError("Could not auto-detect location. Please search manually.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
        );
    } else {
        showError("Geolocation is not supported by your browser.");
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
        const { lat, lon, name, country } = localCities[query];
        return fetchWeather(lat, lon, name, country);
    }

    try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) throw new Error("City not found.");

        const latitude = parseFloat(geoData[0].lat);
        const longitude = parseFloat(geoData[0].lon);
        const fullName = geoData[0].display_name.split(",");
        const name = fullName[0].trim();
        const country = fullName[fullName.length - 1].trim();

        fetchWeather(latitude, longitude, name, country);
    } catch (err) {
        showError(err.message);
    }
}

async function fetchWeather(lat, lon, name, country) {
    try {
        // WeatherAPI forecast endpoint (gives current + 7 days + hourly)
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;
        
        const weatherRes = await fetch(url);
        if (!weatherRes.ok) throw new Error(`API Error: ${weatherRes.status}`);
        
        const data = await weatherRes.json();
        updateUI(data, name, country);
    } catch (err) {
        console.error("Fetch Error:", err);
        showError("Failed to fetch weather data.");
    }
}

function updateUI(data, name, country) {
    const current = data.current;
    const forecastDays = data.forecast.forecastday;
    const todayForecast = forecastDays[0];

    // Trigger Dynamic Background
    setDynamicBackground(current.condition.code, current.is_day);

    document.getElementById("location").textContent = `${data.location.name}, ${data.location.country}`;
    document.getElementById("temperature").textContent = `${Math.round(current.temp_c)}°C`;
    
    document.getElementById("sunrise").textContent = todayForecast.astro.sunrise;
    document.getElementById("sunset").textContent = todayForecast.astro.sunset;

    const conditionInfo = getWeatherCondition(current.condition.code, current.is_day);
    document.getElementById("weatherIcon").textContent = conditionInfo.icon;
    document.getElementById("condition").textContent = current.condition.text;

    document.getElementById("humidity").textContent = `${current.humidity}%`;
    document.getElementById("wind").textContent = `${current.wind_kph} Km/h`;
    document.getElementById("pressure").textContent = `${(current.pressure_mb * 0.02953).toFixed(2)} Inch`;
    document.getElementById("uv").textContent = current.uv;

    // 12-Hour Forecast Logic
    hourlyContainer.innerHTML = ""; 
    const allHours = todayForecast.hour;
    const currentHour = new Date().getHours();
    
    for (let i = currentHour; i < currentHour + 12; i++) {
        // If we run out of hours today, we stop (for simplicity)
        if (!allHours[i]) break; 

        const hourData = allHours[i];
        const time = new Date(hourData.time);
        const displayTime = time.toLocaleTimeString([], { hour: 'numeric' });
        const condition = getWeatherCondition(hourData.condition.code, hourData.is_day);

        const hourCard = document.createElement("div");
        hourCard.className = "hourly-card";
        hourCard.innerHTML = `
            <span class="time">${displayTime}</span>
            <span class="icon">${condition.icon}</span>
            <span class="temp">${Math.round(hourData.temp_c)}°C</span>
        `;
        hourlyContainer.appendChild(hourCard);
    }

    // 7-Day Forecast Logic
    forecastContainer.innerHTML = ""; 
    forecastDays.forEach((day, index) => {
        const dateObj = new Date(day.date);
        const dayName = index === 0 ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = day.date.split('-').reverse().join('-');
        
        const condition = getWeatherCondition(day.day.condition.code, 1);
        
        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <div class="card-header">
                <span class="day-name">${dayName}</span>
                <span class="full-date">${formattedDate}</span>
            </div>
            <div class="card-status">
                <span class="status-icon large-icon">${condition.icon}</span>
                <span class="status-text condition-text">${day.day.condition.text}</span>
            </div>
            <div class="card-metrics-footer">
                <div class="footer-item"><span class="label">Max</span><span class="value">${Math.round(day.day.maxtemp_c)}°C</span></div>
                <div class="footer-item"><span class="label">Avg</span><span class="value">${Math.round(day.day.avgtemp_c)}°C</span></div>
                <div class="footer-item"><span class="label">Min</span><span class="value">${Math.round(day.day.mintemp_c)}°C</span></div>
                <div class="footer-item"><span class="label">Wind</span><span class="value">${day.day.maxwind_kph}kph</span></div>
                <div class="footer-item"><span class="label">Rain</span><span class="value">${day.day.daily_chance_of_rain}%</span></div>
                <div class="footer-item"><span class="label">UV</span><span class="value">${day.day.uv}</span></div>
            </div>
        `;
        forecastContainer.appendChild(card);
    });

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

// Updated mapping for WeatherAPI condition codes
function getWeatherCondition(code, isDay) {
    const sunIcon = isDay ? "☀️" : "🌙";
    const cloudIcon = isDay ? "⛅" : "☁️";

    // Codes based on https://www.weatherapi.com/docs/weather_conditions.json
    if (code === 1000) return { icon: sunIcon, text: "Clear" };
    if ([1003, 1006, 1009].includes(code)) return { icon: cloudIcon, text: "Cloudy" };
    if ([1030, 1135, 1147].includes(code)) return { icon: "🌫️", text: "Fog" };
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return { icon: "🌧️", text: "Rain" };
    if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return { icon: "❄️", text: "Snow" };
    if ([1087, 1273, 1276, 1279, 1282].includes(code)) return { icon: "⛈️", text: "Thunderstorm" };
    
    return { icon: "☁️", text: "Overcast" };
}

function setDynamicBackground(code, isDay) {
    let weatherType = "clouds"; 

    if (code === 1000) weatherType = "clear";
    else if ([1003, 1006, 1009].includes(code)) weatherType = "clouds";
    else if ([1030, 1135, 1147].includes(code)) weatherType = "fog";
    else if ([1063, 1180, 1240, 1243, 1246].includes(code)) weatherType = "rain";
    else if (code >= 1066 && code <= 1258) weatherType = "snow";
    else if ([1087, 1273, 1276].includes(code)) weatherType = "thunder";

    document.body.setAttribute("data-weather", weatherType);

    // Auto-Toggle Dark Mode based on is_day (1 for day, 0 for night)
    const isDarkMode = document.body.classList.contains("dark-mode");
    const themeSwitch = document.getElementById("themeSwitch");
    
    if (isDay === 0 && !isDarkMode) {
        document.body.classList.add("dark-mode");
        themeSwitch.checked = true;
    } else if (isDay === 1 && isDarkMode) {
        document.body.classList.remove("dark-mode");
        themeSwitch.checked = false;
    }
}