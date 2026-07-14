/**
 * MosamCheck — UI Rendering Controller
 * Updates DOM cards, metrics, AQI dial, weather alerts, charts, and background particles.
 */

"use strict";

function renderUI(data) {
  const current = data.current;
  const forecastDays = data.forecast.forecastday;
  const loc = data.location;

  /* Dynamic background (canvas + aurora) */
  setDynamicBackground(current.condition.code, current.is_day);

  /* SEO meta */
  updateMetaTags(loc.name, loc.country, current);

  /* Location & timestamp */
  document.getElementById("location").textContent =
    `${loc.name}, ${loc.country}`;
  document.getElementById("updateTime").textContent =
    `Updated at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  /* Temperature */
  document.getElementById("temperature").textContent =
    `${toTemp(current.temp_c)}${tempUnit()}`;
  document.getElementById("feelsLike").textContent =
    `${toTemp(current.feelslike_c)}${tempUnit()}`;

  /* Astro */
  document.getElementById("sunrise").textContent =
    forecastDays[0].astro.sunrise;
  document.getElementById("sunset").textContent = forecastDays[0].astro.sunset;

  /* Icon & Condition */
  const cond = getWeatherCondition(current.condition.code, current.is_day);
  const iconEl = document.getElementById("weatherIcon");
  if (iconEl) {
    iconEl.textContent = cond.icon;
    iconEl.setAttribute("aria-label", `Weather: ${current.condition.text}`);
  }
  document.getElementById("condition").textContent = current.condition.text;

  /* Metrics */
  document.getElementById("humidity").textContent = `${current.humidity}%`;
  document.getElementById("wind").textContent =
    `${toSpeed(current.wind_kph)} ${speedUnit()}`;
  document.getElementById("pressure").textContent =
    `${(current.pressure_mb * 0.02953).toFixed(2)} in`;
  document.getElementById("uv").textContent = current.uv;

  /* Wind direction sub-label */
  const windDirEl = document.getElementById("windDir");
  if (windDirEl && current.wind_dir) windDirEl.textContent = current.wind_dir;

  /* UV label */
  const uvEl = document.getElementById("uvLabel");
  if (uvEl) uvEl.textContent = uvCategory(current.uv);

  /* Restore saved metric order */
  if (typeof restoreMetricOrder === "function") restoreMetricOrder();

  /* AQI */
  renderAQI(current.air_quality);

  /* Alerts */
  if (!alertDismissed) renderAlerts(data.alerts);

  /* Temperature Chart */
  const combined = [...forecastDays[0].hour, ...forecastDays[1].hour];
  const currentHour = new Date().getHours();
  const next24 = combined.slice(currentHour, currentHour + 24);

  if (!tempChart && typeof TempChart !== "undefined") tempChart = new TempChart();
  if (tempChart) tempChart.setData(next24);

  /* Hourly cards */
  renderHourly(forecastDays);

  /* 3-Day Forecast */
  renderWeekly(forecastDays);

  /* Show dashboard */
  if (loadingEl) loadingEl.classList.add("hidden");
  if (dashboard) dashboard.classList.remove("hidden");
  animateCards();
}

function renderAQI(aqiData) {
  if (!aqiSection) return;
  if (!aqiData) {
    aqiSection.classList.add("hidden");
    return;
  }

  const aqiIndex = Math.min(aqiData["us-epa-index"] ?? 1, 6);
  const info = AQI_INFO[aqiIndex];
  const progress = (aqiIndex - 1) / 5; // 0 → 1
  const fillArc = AQI_ARC * progress; // stroke length for fill
  const trackGap = AQI_CIRCUM - AQI_ARC; // gap stroke (the 90° bottom gap)

  /* Build pollutant rows */
  const pollutants = [
    { label: "PM2.5", value: aqiData.pm2_5 ?? 0, max: 150 },
    { label: "PM10", value: aqiData.pm10 ?? 0, max: 300 },
    { label: "O₃", value: aqiData.o3 ?? 0, max: 180 },
    { label: "NO₂", value: aqiData.no2 ?? 0, max: 200 },
  ];

  const pollutantHTML = pollutants
    .map(
      (p) => `
        <div class="pollutant-item">
            <span class="pollutant-label">${p.label}</span>
            <div class="pollutant-bar">
                <div class="pollutant-fill"
                    data-pct="${Math.min((p.value / p.max) * 100, 100).toFixed(1)}"
                    style="width:0%; background:${info.color}">
                </div>
            </div>
            <span class="pollutant-value">${Math.round(p.value)} µg/m³</span>
        </div>
    `,
    )
    .join("");

  aqiSection.innerHTML = `
        <div class="aqi-left">
            <svg class="aqi-dial" viewBox="0 0 160 160" role="img" aria-label="AQI level ${aqiIndex}: ${info.label}">
                <!-- Track (270° arc, gap at bottom) -->
                <circle class="aqi-track" cx="80" cy="80" r="${AQI_RADIUS}"
                    stroke-dasharray="${AQI_ARC} ${trackGap}"
                    transform="rotate(135 80 80)" />
                <!-- Fill (animated from 0 to progress) -->
                <circle class="aqi-fill" id="aqiFillCircle" cx="80" cy="80" r="${AQI_RADIUS}"
                    stroke="${info.color}"
                    stroke-dasharray="0.01 ${AQI_CIRCUM}"
                    transform="rotate(135 80 80)" />
                <!-- Center: index number -->
                <text x="80" y="74" class="aqi-number" fill="${info.color}">${aqiIndex}</text>
                <text x="80" y="90" class="aqi-label-text" fill="rgba(255,255,255,0.45)">AQI</text>
                <text x="80" y="106" class="aqi-category-text" fill="${info.color}">${info.label}</text>
            </svg>
        </div>
        <div class="aqi-right">
            <h3>Air Quality Index</h3>
            <p class="aqi-range-info">US EPA Category ${aqiIndex} &middot; ${info.range} &middot; ${info.desc}</p>
            <div class="aqi-pollutants">${pollutantHTML}</div>
        </div>
    `;

  aqiSection.classList.remove("hidden");

  /* Animate the dial fill and pollutant bars after a tick */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const fillEl = document.getElementById("aqiFillCircle");
      if (fillEl) {
        fillEl.style.transition =
          "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)";
        fillEl.setAttribute(
          "stroke-dasharray",
          `${fillArc} ${AQI_CIRCUM - fillArc}`,
        );
      }
      document.querySelectorAll(".pollutant-fill").forEach((bar) => {
        const pct = bar.dataset.pct;
        bar.style.transition = "width 1.4s cubic-bezier(0.4,0,0.2,1)";
        bar.style.width = pct + "%";
      });
    });
  });
}

function renderAlerts(alertsObj) {
  if (!alertsObj || !alertsObj.alert || !alertsObj.alert.length) return;

  allAlerts = alertsObj.alert;
  currentAlertIdx = 0;
  showAlert(0);

  /* Multi-alert navigation */
  const navEl = document.getElementById("alertNav");
  if (navEl && allAlerts.length > 1) {
    navEl.innerHTML = `
            <button id="alertPrev" aria-label="Previous alert">‹</button>
            <span id="alertCounter">1 / ${allAlerts.length}</span>
            <button id="alertNext" aria-label="Next alert">›</button>
        `;
    document.getElementById("alertPrev").addEventListener("click", () => {
      currentAlertIdx =
        (currentAlertIdx - 1 + allAlerts.length) % allAlerts.length;
      showAlert(currentAlertIdx);
    });
    document.getElementById("alertNext").addEventListener("click", () => {
      currentAlertIdx = (currentAlertIdx + 1) % allAlerts.length;
      showAlert(currentAlertIdx);
    });
  } else if (navEl) {
    navEl.innerHTML = "";
  }
}

function showAlert(idx) {
  const alert = allAlerts[idx];
  if (!alert || !alertBanner) return;

  const headlineEl = document.getElementById("alertHeadline");
  if (headlineEl) {
    headlineEl.textContent = alert.headline || alert.event || "Weather Alert";
  }
  const descEl = document.getElementById("alertDesc");
  if (descEl) {
    descEl.textContent = alert.desc
      ? alert.desc.length > 160
        ? alert.desc.substring(0, 157) + "…"
        : alert.desc
      : "";
  }

  const counterEl = document.getElementById("alertCounter");
  if (counterEl) counterEl.textContent = `${idx + 1} / ${allAlerts.length}`;

  const sev = (alert.severity || "moderate").toLowerCase();
  alertBanner.dataset.severity = sev;
  alertBanner.classList.remove("hidden");
}

if (alertDismissBtn) {
  alertDismissBtn.addEventListener("click", () => {
    if (!alertBanner) return;
    alertBanner.classList.add("dismissing");
    setTimeout(() => {
      alertBanner.classList.add("hidden");
      alertBanner.classList.remove("dismissing");
    }, 320);
    alertDismissed = true;
  });
}

function renderHourly(forecastDays) {
  if (!hourlyContainer) return;
  hourlyContainer.innerHTML = "";
  const combined = [...forecastDays[0].hour, ...forecastDays[1].hour];
  const currentHour = new Date().getHours();

  for (let i = currentHour; i < currentHour + 12; i++) {
    const h = combined[i];
    if (!h) continue;

    const hCond = getWeatherCondition(h.condition.code, h.is_day);
    const timeStr = new Date(h.time).toLocaleTimeString([], {
      hour: "numeric",
      hour12: true,
    });
    const rainPct = h.chance_of_rain;

    const card = document.createElement("article");
    card.className = "hourly-card glass-card card-animate";
    card.setAttribute("role", "listitem");
    card.setAttribute(
      "aria-label",
      `${timeStr}: ${Math.round(h.temp_c)}°C, ${h.condition.text}`,
    );
    card.innerHTML = `
            <span class="time">${timeStr}</span>
            <span class="icon" aria-hidden="true">${hCond.icon}</span>
            <span class="temp">${toTemp(h.temp_c)}${tempUnit()}</span>
            ${
              rainPct > 0
                ? `<span class="rain-chance">🌂 ${rainPct}%</span>`
                : `<span class="rain-chance" style="opacity:0">-</span>`
            }
        `;
    hourlyContainer.appendChild(card);
  }
}

function renderWeekly(forecastDays) {
  if (!forecastContainer) return;
  forecastContainer.innerHTML = "";

  forecastDays.forEach((day, index) => {
    const cond = getWeatherCondition(day.day.condition.code, 1);
    const dayName =
      index === 0
        ? "Today"
        : new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
          });
    const dateStr = new Date(day.date + "T00:00:00").toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    );

    const card = document.createElement("article");
    card.className = "forecast-card glass-card card-animate";
    card.setAttribute("role", "listitem");
    card.setAttribute(
      "aria-label",
      `${dayName}: ${day.day.condition.text}, high ${Math.round(day.day.maxtemp_c)}°C, low ${Math.round(day.day.mintemp_c)}°C`,
    );

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

function animateCards() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".card-animate").forEach((card, i) => {
      setTimeout(() => card.classList.add("visible"), i * 55);
    });
    if (typeof init3DTilt === "function") init3DTilt();
  });
}

function getWeatherCondition(code, isDay) {
  const dayIcon = isDay ? "☀️" : "🌙";
  const cloudIcon = isDay ? "⛅" : "☁️";

  if (code === 1000) return { icon: dayIcon };
  if (code === 1003) return { icon: cloudIcon };
  if ([1006, 1009].includes(code)) return { icon: "☁️" };
  if ([1030, 1135, 1147].includes(code)) return { icon: "🌫️" };
  if (
    [
      1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1240,
      1243, 1246,
    ].includes(code)
  )
    return { icon: "🌧️" };
  if ([1198, 1201].includes(code)) return { icon: "🌨️" };
  if (
    [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(
      code,
    )
  )
    return { icon: "❄️" };
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return { icon: "⛈️" };
  return { icon: "🌥️" };
}

function setDynamicBackground(code, isDay) {
  let type = "clouds";

  if (code === 1000) type = "clear";
  else if (
    [
      1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246,
    ].includes(code)
  )
    type = "rain";
  else if ([1087, 1273, 1276, 1279, 1282].includes(code)) type = "thunder";
  else if (
    [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225].includes(code)
  )
    type = "snow";

  document.body.setAttribute("data-weather", type);
  if (typeof weatherParticles !== "undefined" && weatherParticles) {
    weatherParticles.setWeather(type, isDay === 1);
  }

  if (typeof weatherSoundscape !== "undefined" && weatherSoundscape) {
    weatherSoundscape.syncWithWeather(type, isDay === 1);
  }
}
