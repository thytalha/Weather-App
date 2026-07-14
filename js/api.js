/**
 * MosamCheck — API & Network Service Layer
 * Handles geolocation access, Nominatim coordinate resolution, and WeatherAPI data fetching.
 */

"use strict";

function loadUserLocation() {
  hideAll();
  showLoading();
  if (!navigator.geolocation) {
    showError(
      "Geolocation is not supported by your browser. Please search for a city manually.",
    );
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) =>
      fetchWeather(
        pos.coords.latitude,
        pos.coords.longitude,
        "Your Location",
        "",
      ),
    (err) => {
      const msgs = {
        1: "Location access was denied. Please search for a city manually.",
        2: "Location unavailable. Please search for a city.",
        3: "Location request timed out. Please try again.",
      };
      showError(msgs[err.code] || "Could not get your location.");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
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
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();

    if (!data.length)
      throw new Error(
        `"${city}" not found. Try a different spelling or add the country name.`,
      );

    const parts = data[0].display_name.split(",");
    const name = parts[0].trim();
    const country = parts[parts.length - 1].trim();
    await fetchWeather(
      parseFloat(data[0].lat),
      parseFloat(data[0].lon),
      name,
      country,
    );
  } catch (err) {
    showError(err.message);
  }
}

async function fetchWeather(lat, lon, name, country) {
  try {
    /* Updated: aqi=yes & alerts=yes */
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3&aqi=yes&alerts=yes`;
    const res = await fetch(url);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData?.error?.message ||
          "Weather service is temporarily unavailable. Please try again.",
      );
    }

    const data = await res.json();
    lastWeatherData = data;
    renderUI(data);
  } catch (err) {
    showError(err.message);
  }
}
