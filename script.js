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
                
                try {
                    const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                    const geoData = await geoRes.json();
                    
                    let city = geoData.city || geoData.locality || "Your Location";
                    let country = geoData.countryName || "";
                    
                    fetchWeather(lat, lon, city, country);
                } catch (err) {
                    fetchWeather(lat, lon, "Your Location", "");
                }
            },
            (err) => {
                showError("Could not auto-detect location. Please search manually.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
        );
    } else {
        showError("Geolocation is not supported by your browser. Please search manually.");
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

        if (!geoData || geoData.length === 0) {
            throw new Error("City not found. Check the spelling.");
        }

        const latitude = parseFloat(geoData[0].lat);
        const longitude = parseFloat(geoData[0].lon);
        
        const fullName = geoData[0].display_name.split(",");
        const name = fullName[0].trim();
        const country = fullName.length > 1 ? fullName[fullName.length - 1].trim() : "";

        fetchWeather(latitude, longitude, name, country);
    } catch (err) {
        showError(err.message);
    }
}

async function fetchWeather(lat, lon, name, country) {
    try {
        // --- FIX 1: Added sunrise and sunset back to the API request ---
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,windspeed_10m_max,precipitation_probability_max,uv_index_max&timezone=auto`;
        
        const weatherRes = await fetch(url);
        
        if (!weatherRes.ok) {
            throw new Error(`API Error: ${weatherRes.status}`);
        }
        
        const data = await weatherRes.json();
        updateUI(data, name, country);
    } catch (err) {
        console.error("Fetch Error:", err);
        showError("Failed to fetch weather data. Check console for details.");
    }
}

function updateUI(data, name, country) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    document.getElementById("location").textContent = country ? `${name}, ${country}` : name;
    document.getElementById("temperature").textContent = `${Math.round(current.temperature_2m)}°C`;
    
    // Restore Sunrise and Sunset formatting
    if (daily.sunrise && daily.sunset) {
        const sunriseObj = new Date(daily.sunrise[0]);
        const sunsetObj = new Date(daily.sunset[0]);
        document.getElementById("sunrise").textContent = sunriseObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById("sunset").textContent = sunsetObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        document.getElementById("sunrise").textContent = "--:--";
        document.getElementById("sunset").textContent = "--:--";
    }

    const conditionInfo = getWeatherCondition(current.weather_code, current.is_day);
    document.getElementById("weatherIcon").textContent = conditionInfo.icon;
    document.getElementById("condition").textContent = conditionInfo.text;

    document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
    document.getElementById("wind").textContent = `${current.wind_speed_10m} Km/h`;
    
    const pressureInches = (current.surface_pressure * 0.02953).toFixed(2);
    document.getElementById("pressure").textContent = `${pressureInches} Inch`;
    
    document.getElementById("uv").textContent = daily.uv_index_max ? daily.uv_index_max[0] : "0";

    // --- FIX 2: Loop only 12 times instead of 24 for the hourly forecast ---
    hourlyContainer.innerHTML = ""; 
    const currentHourIdx = new Date().getHours();
    for (let i = currentHourIdx; i < currentHourIdx + 12; i++) {
        // Prevent array out-of-bounds if near the end of the 24h data
        if (!hourly.time[i]) break; 

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

    forecastContainer.innerHTML = ""; 
    for (let i = 0; i < 7; i++) {
        const dateRaw = daily.time[i];
        const dateObj = new Date(dateRaw);
        const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        const dayNum = String(dateObj.getDate()).padStart(2, '0');
        const monthNum = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yearNum = dateObj.getFullYear();
        const formattedDate = `${dayNum}-${monthNum}-${yearNum}`;
        
        const condition = getWeatherCondition(daily.weather_code[i], 1);
        
        const maxTemp = daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[i]) : "--";
        const minTemp = daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[i]) : "--";
        const avgTemp = (maxTemp !== "--" && minTemp !== "--") ? Math.round((maxTemp + minTemp) / 2) : "--";
        
        let maxWind = "--";
        if (daily.windspeed_10m_max) maxWind = daily.windspeed_10m_max[i];
        else if (daily.wind_speed_10m_max) maxWind = daily.wind_speed_10m_max[i];

        const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : "--";
        const maxUV = daily.uv_index_max ? daily.uv_index_max[i] : "--";

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <div class="card-header">
                <span class="day-name">${dayName}</span>
                <span class="full-date">${formattedDate}</span>
            </div>
            
            <div class="card-status">
                <span class="status-icon large-icon">${condition.icon}</span>
                <span class="status-text condition-text">${condition.text}</span>
            </div>
            
            <div class="card-metrics-footer">
                <div class="footer-item">
                    <span class="label">Max</span>
                    <span class="value">${maxTemp}°C</span>
                </div>
                <div class="footer-item">
                    <span class="label">Avg</span>
                    <span class="value">${avgTemp}°C</span>
                </div>
                <div class="footer-item">
                    <span class="label">Min</span>
                    <span class="value">${minTemp}°C</span>
                </div>
                <div class="footer-item">
                    <span class="label">Wind</span>
                    <span class="value">${maxWind} km/h</span>
                </div>
                <div class="footer-item">
                    <span class="label">Rain</span>
                    <span class="value">${rainProb}%</span>
                </div>
                <div class="footer-item">
                    <span class="label">UV Index</span>
                    <span class="value">${maxUV}</span>
                </div>
            </div>
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