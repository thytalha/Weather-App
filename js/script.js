/**
 * MosamCheck — Next-Gen Weather Dashboard
 * Features: Canvas Particles · SVG Temperature Chart · AQI Dial
 *           Weather Alerts · Drag-and-Drop Metrics · Ripple Effects
 *           Unit Toggles · Search Suggestions · Dynamic Backgrounds
 */

"use strict";

/* ==========================================================
   CONFIGURATION
   ========================================================== */
const API_KEY = "f26451880dec4cf0a3d142457260704";

const LOCAL_CITIES = {
  "garh more": {
    lat: 30.846,
    lon: 71.845,
    name: "Garh More",
    country: "Pakistan",
  },
  "garh maharaja": {
    lat: 30.833,
    lon: 71.905,
    name: "Garh Maharaja",
    country: "Pakistan",
  },
  "g m raja": {
    lat: 30.833,
    lon: 71.905,
    name: "Garh Maharaja",
    country: "Pakistan",
  },
};

/* AQI EPA Index info table */
const AQI_INFO = [
  null,
  {
    label: "Good",
    color: "#22c55e",
    range: "0–50",
    desc: "Air quality is satisfactory.",
  },
  {
    label: "Moderate",
    color: "#eab308",
    range: "51–100",
    desc: "Acceptable quality; some pollutants may concern sensitive groups.",
  },
  {
    label: "Unhealthy for Sensitive",
    color: "#f97316",
    range: "101–150",
    desc: "Sensitive groups may experience health effects.",
  },
  {
    label: "Unhealthy",
    color: "#ef4444",
    range: "151–200",
    desc: "Everyone may begin to experience health effects.",
  },
  {
    label: "Very Unhealthy",
    color: "#a855f7",
    range: "201–300",
    desc: "Health alert: everyone may experience serious effects.",
  },
  {
    label: "Hazardous",
    color: "#dc2626",
    range: "301+",
    desc: "Health warning of emergency conditions.",
  },
];

/* AQI dial constants */
const AQI_RADIUS = 60;
const AQI_CIRCUM = 2 * Math.PI * AQI_RADIUS; // ≈ 376.99
const AQI_ARC = AQI_CIRCUM * 0.75; // 270° arc ≈ 282.74
const AQI_GAP = AQI_CIRCUM - AQI_ARC; // 90° gap ≈ 94.25

/* ==========================================================
   STATE
   ========================================================== */
let currentUnit = "C";
let currentSpeedUnit = "kph";
let lastWeatherData = null;
let debounceTimer = null;
let alertDismissed = false;
let currentAlertIdx = 0;
let allAlerts = [];

/* ==========================================================
   DOM REFERENCES
   ========================================================== */
const themeSwitch = document.getElementById("themeSwitch");
const cityInput = document.getElementById("cityInput");
const clearBtn = document.getElementById("clearBtn");
const currentLocBtn = document.getElementById("currentLocBtn");
const dashboard = document.getElementById("weatherDashboard");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const forecastContainer = document.getElementById("forecastContainer");
const hourlyContainer = document.getElementById("hourlyContainer");
const suggestionsEl = document.getElementById("searchSuggestions");
const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");
const kphBtn = document.getElementById("kphBtn");
const mphBtn = document.getElementById("mphBtn");
const alertBanner = document.getElementById("alertBanner");
const alertDismissBtn = document.getElementById("alertDismiss");
const metricsGrid = document.getElementById("metricsGrid");
const tempChartCanvas = document.getElementById("tempChart");
const chartTooltip = document.getElementById("chartTooltip");
const aqiSection = document.getElementById("aqiSection");

/* ==========================================================
   ██████  WEATHER PARTICLE SYSTEM
   ========================================================== */
class WeatherParticles {
  constructor() {
    this.canvas = document.getElementById("weatherCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    this.type = "none";
    this.isDay = true;
    this.lightningCountdown = 180;
    this.lightningFlash = 0;
    this.animId = null;
    this._bound_loop = this.loop.bind(this);
    this._bound_resize = this.resize.bind(this);
    window.addEventListener("resize", this._bound_resize);
    this.resize();
    this.loop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.initParticles();
  }

  setWeather(type, isDay) {
    if (this.type === type && this.isDay === isDay) return;
    this.type = type;
    this.isDay = isDay;
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const W = this.canvas.width;
    const H = this.canvas.height;

    switch (this.type) {
      case "rain":
      case "thunder":
        for (let i = 0; i < 160; i++) {
          this.particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speed: 10 + Math.random() * 9,
            length: 14 + Math.random() * 24,
            opacity: 0.25 + Math.random() * 0.4,
            width: 0.5 + Math.random() * 0.9,
          });
        }
        this.lightningCountdown = 120 + Math.floor(Math.random() * 180);
        break;

      case "snow":
        for (let i = 0; i < 90; i++) {
          this.particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            radius: 1.5 + Math.random() * 3.5,
            speed: 0.4 + Math.random() * 1.2,
            drift: Math.random() * Math.PI * 2,
            driftSpeed: 0.008 + Math.random() * 0.018,
            opacity: 0.4 + Math.random() * 0.5,
          });
        }
        break;

      case "clear":
        if (!this.isDay) {
          // Stars
          for (let i = 0; i < 120; i++) {
            this.particles.push({
              x: Math.random() * W,
              y: Math.random() * H * 0.65,
              radius: 0.4 + Math.random() * 1.6,
              twinkle: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.025 + Math.random() * 0.04,
              opacity: 0.3 + Math.random() * 0.6,
            });
          }
        }
        break;

      default:
        break;
    }
  }

  loop() {
    this.animId = requestAnimationFrame(this._bound_loop);
    this.update();
    this.draw();
  }

  update() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    if (this.type === "thunder") {
      this.lightningCountdown--;
      if (this.lightningCountdown <= 0) {
        this.lightningFlash = 4 + Math.floor(Math.random() * 4);
        this.lightningCountdown = 100 + Math.floor(Math.random() * 200);
      }
      if (this.lightningFlash > 0) this.lightningFlash--;
    }

    this.particles.forEach((p) => {
      switch (this.type) {
        case "rain":
        case "thunder":
          p.y += p.speed;
          p.x += p.speed * 0.18;
          if (p.y - p.length > H || p.x > W) {
            p.y = -(p.length + Math.random() * 40);
            p.x = Math.random() * W;
          }
          break;
        case "snow":
          p.drift += p.driftSpeed;
          p.x += Math.sin(p.drift) * 0.55;
          p.y += p.speed;
          if (p.y > H + 10) {
            p.y = -10;
            p.x = Math.random() * W;
          }
          if (p.x < -10) p.x = W + 10;
          if (p.x > W + 10) p.x = -10;
          break;
        case "clear":
          if (!this.isDay && p.twinkle !== undefined) {
            p.twinkle += p.twinkleSpeed;
          }
          break;
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const isDarkMode = document.body.classList.contains("dark-mode");

    /* Lightning flash overlay */
    if (this.type === "thunder" && this.lightningFlash > 0) {
      const alpha = (this.lightningFlash / 8) * (isDarkMode ? 0.18 : 0.25);
      ctx.fillStyle = isDarkMode
        ? `rgba(210, 220, 255, ${alpha})`
        : `rgba(150, 180, 240, ${alpha})`;
      ctx.fillRect(0, 0, W, H);

      /* Occasional bolt */
      if (this.lightningFlash > 5) {
        this.drawLightningBolt(
          ctx,
          W * 0.3 + Math.random() * W * 0.4,
          0,
          W * 0.2 + Math.random() * W * 0.6,
          H * 0.55,
        );
      }
    }

    this.particles.forEach((p) => {
      ctx.save();
      switch (this.type) {
        case "rain":
        case "thunder": {
          const strokeColor = isDarkMode
            ? `rgba(180, 220, 255, ${p.opacity})`
            : `rgba(25, 80, 155, ${Math.min(1, p.opacity * 1.8)})`;
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isDarkMode ? p.width : p.width * 1.45;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speed * 0.18, p.y + p.length);
          ctx.stroke();
          break;
        }
        case "snow": {
          const a = p.opacity * (0.65 + 0.35 * Math.sin(p.drift));
          const fillColor = isDarkMode
            ? `rgba(255, 255, 255, ${a})`
            : `rgba(75, 125, 185, ${Math.min(1, a * 1.7)})`;
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "clear": {
          if (!this.isDay && p.twinkle !== undefined) {
            const a = p.opacity * (0.45 + 0.55 * Math.abs(Math.sin(p.twinkle)));
            const fillColor = isDarkMode
              ? `rgba(255, 255, 255, ${a})`
              : `rgba(60, 95, 160, ${Math.min(1, a * 1.6)})`;
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
      }
      ctx.restore();
    });
  }

  drawLightningBolt(ctx, startX, startY, endX, endY) {
    const isDarkMode = document.body.classList.contains("dark-mode");
    ctx.save();
    ctx.strokeStyle = isDarkMode
      ? "rgba(255, 255, 255, 0.85)"
      : "rgba(25, 65, 140, 0.9)";
    ctx.lineWidth = isDarkMode ? 1.5 : 2.2;
    ctx.shadowColor = isDarkMode
      ? "rgba(180, 200, 255, 0.9)"
      : "rgba(30, 70, 150, 0.6)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    const segments = 6;
    ctx.moveTo(startX, startY);
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const mx = startX + (endX - startX) * t + (Math.random() - 0.5) * 80;
      const my = startY + (endY - startY) * t;
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }
}

/* ==========================================================
   ████  INTERACTIVE TEMPERATURE CHART
   ========================================================== */
class TempChart {
  constructor() {
    this.canvas = tempChartCanvas;
    this.ctx = this.canvas.getContext("2d");
    this.tooltip = chartTooltip;
    this.data = [];
    this.hoveredI = -1;
    this.PAD = { top: 24, bottom: 44, left: 44, right: 18 };
    this.animProgress = 0;
    this.animId = null;

    this.canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
    this.canvas.addEventListener("mouseleave", this._onMouseLeave.bind(this));
    this.canvas.addEventListener("touchstart", this._onTouch.bind(this), {
      passive: true,
    });
    this.canvas.addEventListener("touchmove", this._onTouch.bind(this), {
      passive: true,
    });
    this.canvas.addEventListener("touchend", this._onMouseLeave.bind(this));

    this._ro = new ResizeObserver(() => {
      if (this.data.length) this.render(1);
    });
    this._ro.observe(this.canvas.parentElement);
  }

  setData(hours) {
    this.data = hours.map((h) => ({
      time: new Date(h.time),
      temp_c: h.temp_c,
      chance_of_rain: h.chance_of_rain,
      condition: h.condition.text,
      is_day: h.is_day,
      code: h.condition.code,
    }));
    this.animProgress = 0;
    if (this.animId) cancelAnimationFrame(this.animId);
    this._animateDraw();
  }

  _animateDraw() {
    this.animProgress = Math.min(this.animProgress + 0.04, 1);
    this.render(this.animProgress);
    if (this.animProgress < 1) {
      this.animId = requestAnimationFrame(this._animateDraw.bind(this));
    } else {
      this.animId = null;
    }
  }

  _resize() {
    const container = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const cRect = container.getBoundingClientRect();
    const W = cRect.width;
    const H = cRect.height;
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width = W + "px";
    this.canvas.style.height = H + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W, H };
  }

  render(progress = 1) {
    if (!this.data.length) return;
    const { W, H } = this._resize();
    const ctx = this.ctx;
    const P = this.PAD;
    ctx.clearRect(0, 0, W, H);

    const chartW = W - P.left - P.right;
    const chartH = H - P.top - P.bottom;

    const temps = this.data.map((d) => d.temp_c);
    const minTemp = Math.min(...temps) - 3;
    const maxTemp = Math.max(...temps) + 3;

    const getX = (i) => P.left + i * (chartW / (this.data.length - 1));
    const getY = (tmp) =>
      P.top + chartH - ((tmp - minTemp) / (maxTemp - minTemp)) * chartH;

    const points = this.data.map((d, i) => ({ x: getX(i), y: getY(d.temp_c) }));

    /* ── Rain probability bars (background) ── */
    this.data.forEach((d, i) => {
      if (d.chance_of_rain <= 0) return;
      const x = getX(i);
      const barH = (d.chance_of_rain / 100) * chartH * 0.45;
      const barY = P.top + chartH - barH;
      const step = chartW / (this.data.length - 1);
      ctx.fillStyle = `rgba(96, 165, 250, ${(d.chance_of_rain / 100) * 0.25})`;
      ctx.beginPath();
      ctx.rect(x - step * 0.45, barY, step * 0.9, barH);
      ctx.fill();
    });

    /* ── Subtle grid ── */
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = P.top + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(P.left, y);
      ctx.lineTo(W - P.right, y);
      ctx.stroke();
    }

    /* ── Animated clip path for line drawing ── */
    const clipX = P.left + chartW * progress;
    ctx.save();
    ctx.beginPath();
    ctx.rect(P.left, 0, clipX - P.left, H);
    ctx.clip();

    /* ── Gradient fill under curve ── */
    const grad = ctx.createLinearGradient(0, P.top, 0, P.top + chartH);
    grad.addColorStop(0, "rgba(79, 195, 247, 0.28)");
    grad.addColorStop(0.7, "rgba(79, 195, 247, 0.06)");
    grad.addColorStop(1, "rgba(79, 195, 247, 0)");

    ctx.beginPath();
    this._drawSmooth(ctx, points);
    ctx.lineTo(getX(this.data.length - 1), P.top + chartH);
    ctx.lineTo(getX(0), P.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* ── Temperature line ── */
    ctx.beginPath();
    this._drawSmooth(ctx, points);
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(79, 195, 247, 0.5)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    /* ── Data-point dots ── */
    this.data.forEach((d, i) => {
      if (getX(i) > clipX) return;
      const x = getX(i);
      const y = getY(d.temp_c);
      const isHovered = i === this.hoveredI;

      if (isHovered) {
        /* Glow ring */
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(79, 195, 247, 0.18)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "#fff" : "#4fc3f7";
      ctx.shadowColor = "rgba(79, 195, 247, 0.8)";
      ctx.shadowBlur = isHovered ? 10 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isHovered) {
        ctx.strokeStyle = "#4fc3f7";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    /* ── Hover vertical line ── */
    if (this.hoveredI >= 0 && getX(this.hoveredI) <= clipX) {
      const x = getX(this.hoveredI);
      ctx.beginPath();
      ctx.moveTo(x, P.top);
      ctx.lineTo(x, P.top + chartH);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* ── X-axis time labels ── */
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = `500 10px Poppins, sans-serif`;
    ctx.textAlign = "center";
    this.data.forEach((d, i) => {
      if (i % 4 !== 0 && i !== this.data.length - 1) return;
      const x = getX(i);
      if (x > clipX + 2) return;
      const label = d.time.toLocaleTimeString([], {
        hour: "numeric",
        hour12: true,
      });
      ctx.fillText(label, x, H - 10);
    });

    /* ── Y-axis temp labels ── */
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const tmp = minTemp + (maxTemp - minTemp) * (1 - i / 4);
      const y = P.top + (i / 4) * chartH;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(`${Math.round(tmp)}°`, P.left - 6, y + 4);
    }
  }

  _drawSmooth(ctx, pts) {
    if (!pts.length) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1],
        c = pts[i];
      const dx = (c.x - p.x) * 0.38;
      ctx.bezierCurveTo(p.x + dx, p.y, c.x - dx, c.y, c.x, c.y);
    }
  }

  _getIndexAtX(clientX) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const chartW = rect.width - this.PAD.left - this.PAD.right;
    const idx = Math.round(
      (x - this.PAD.left) / (chartW / (this.data.length - 1)),
    );
    return Math.max(0, Math.min(this.data.length - 1, idx));
  }

  _onMouseMove(e) {
    const i = this._getIndexAtX(e.clientX);
    if (i !== this.hoveredI) {
      this.hoveredI = i;
      this.render(1);
    }
    this._showTooltip(e.clientX, e.clientY, i);
  }

  _onTouch(e) {
    if (!e.touches.length) return;
    const touch = e.touches[0];
    const i = this._getIndexAtX(touch.clientX);
    this.hoveredI = i;
    this.render(1);
    this._showTooltip(touch.clientX, touch.clientY, i);
  }

  _onMouseLeave() {
    this.hoveredI = -1;
    this.render(1);
    this.tooltip.classList.add("hidden");
  }

  _showTooltip(clientX, clientY, index) {
    const d = this.data[index];
    const timeStr = d.time.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const icon = getWeatherCondition(d.code, d.is_day).icon;

    this.tooltip.innerHTML = `
            <div class="tooltip-time">${timeStr}</div>
            <div class="tooltip-temp">${toTemp(d.temp_c)}${tempUnit()}</div>
            ${
              d.chance_of_rain > 0
                ? `<div class="tooltip-rain">🌂 ${d.chance_of_rain}% rain</div>`
                : ""
            }
            <div class="tooltip-cond">${icon} ${d.condition}</div>
        `;

    const containerRect = this.canvas.parentElement.getBoundingClientRect();
    let left = clientX - containerRect.left + 14;
    let top = clientY - containerRect.top - 70;

    if (left + 130 > containerRect.width)
      left = clientX - containerRect.left - 130;
    if (top < 4) top = 4;

    this.tooltip.style.left = left + "px";
    this.tooltip.style.top = top + "px";
    this.tooltip.classList.remove("hidden");
  }
}

/* ==========================================================
   WEATHER PARTICLES INSTANCE
   ========================================================== */
const weatherParticles = new WeatherParticles();

/* ==========================================================
   TEMP CHART INSTANCE
   ========================================================== */
let tempChart = null;

/* ==========================================================
   THEME TOGGLE
   ========================================================== */
themeSwitch.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", themeSwitch.checked);
  if (typeof weatherParticles !== "undefined") {
    weatherParticles.isDay = !themeSwitch.checked;
    weatherParticles.initParticles();
  }
});

/* ==========================================================
   UNIT TOGGLES
   ========================================================== */
function activateUnitBtn(activeBtn, inactiveBtn, newUnit, type) {
  if (type === "temp") currentUnit = newUnit;
  else currentSpeedUnit = newUnit;
  activeBtn.classList.add("active");
  activeBtn.setAttribute("aria-pressed", "true");
  inactiveBtn.classList.remove("active");
  inactiveBtn.setAttribute("aria-pressed", "false");
  if (lastWeatherData) renderUI(lastWeatherData);
}

celsiusBtn.addEventListener("click", () =>
  activateUnitBtn(celsiusBtn, fahrenheitBtn, "C", "temp"),
);
fahrenheitBtn.addEventListener("click", () =>
  activateUnitBtn(fahrenheitBtn, celsiusBtn, "F", "temp"),
);
kphBtn.addEventListener("click", () =>
  activateUnitBtn(kphBtn, mphBtn, "kph", "speed"),
);
mphBtn.addEventListener("click", () =>
  activateUnitBtn(mphBtn, kphBtn, "mph", "speed"),
);

/* ==========================================================
   UNIT CONVERSION HELPERS
   ========================================================== */
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

/* ==========================================================
   RIPPLE EFFECT
   ========================================================== */
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

/* ==========================================================
   SEARCH — INPUT & CLEAR
   ========================================================== */
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

/* ==========================================================
   SEARCH SUGGESTIONS (Nominatim)
   ========================================================== */
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
  cityInput.setAttribute("aria-expanded", "true");
}

function hideSuggestions() {
  suggestionsEl.classList.add("hidden");
  suggestionsEl.innerHTML = "";
  cityInput.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) hideSuggestions();
});

/* ==========================================================
   LOCATION & FETCH
   ========================================================== */
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

/* ==========================================================
   RENDER UI
   ========================================================== */
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
  iconEl.textContent = cond.icon;
  iconEl.setAttribute("aria-label", `Weather: ${current.condition.text}`);
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
  restoreMetricOrder();

  /* AQI */
  renderAQI(current.air_quality);

  /* Alerts */
  if (!alertDismissed) renderAlerts(data.alerts);

  /* Temperature Chart */
  const combined = [...forecastDays[0].hour, ...forecastDays[1].hour];
  const currentHour = new Date().getHours();
  const next24 = combined.slice(currentHour, currentHour + 24);

  if (!tempChart) tempChart = new TempChart();
  tempChart.setData(next24);

  /* Hourly cards */
  renderHourly(forecastDays);

  /* 3-Day Forecast */
  renderWeekly(forecastDays);

  /* Show dashboard */
  loadingEl.classList.add("hidden");
  dashboard.classList.remove("hidden");
  animateCards();
}

/* ==========================================================
   UV CATEGORY HELPER
   ========================================================== */
function uvCategory(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

/* ==========================================================
   ████  AQI RENDER
   ========================================================== */
function renderAQI(aqiData) {
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

/* ==========================================================
   ████  WEATHER ALERTS RENDER
   ========================================================== */
function renderAlerts(alertsObj) {
  if (!alertsObj || !alertsObj.alert || !alertsObj.alert.length) return;

  allAlerts = alertsObj.alert;
  currentAlertIdx = 0;
  showAlert(0);

  /* Multi-alert navigation */
  const navEl = document.getElementById("alertNav");
  if (allAlerts.length > 1) {
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
  } else {
    navEl.innerHTML = "";
  }
}

function showAlert(idx) {
  const alert = allAlerts[idx];
  if (!alert) return;

  document.getElementById("alertHeadline").textContent =
    alert.headline || alert.event || "Weather Alert";
  document.getElementById("alertDesc").textContent = alert.desc
    ? alert.desc.length > 160
      ? alert.desc.substring(0, 157) + "…"
      : alert.desc
    : "";

  const counterEl = document.getElementById("alertCounter");
  if (counterEl) counterEl.textContent = `${idx + 1} / ${allAlerts.length}`;

  const sev = (alert.severity || "moderate").toLowerCase();
  alertBanner.dataset.severity = sev;
  alertBanner.classList.remove("hidden");
}

alertDismissBtn.addEventListener("click", () => {
  alertBanner.classList.add("dismissing");
  setTimeout(() => {
    alertBanner.classList.add("hidden");
    alertBanner.classList.remove("dismissing");
  }, 320);
  alertDismissed = true;
});

/* ==========================================================
   ████  HOURLY CHART DATA RENDER (12 cards)
   ========================================================== */
function renderHourly(forecastDays) {
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

/* ==========================================================
   ████  3-DAY FORECAST RENDER
   ========================================================== */
function renderWeekly(forecastDays) {
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

/* ==========================================================
   STAGGERED CARD ANIMATIONS
   ========================================================== */
function animateCards() {
  requestAnimationFrame(() => {
    document.querySelectorAll(".card-animate").forEach((card, i) => {
      setTimeout(() => card.classList.add("visible"), i * 55);
    });
    if (typeof init3DTilt === "function") init3DTilt();
  });
}

/* ==========================================================
   WEATHER CONDITION MAPPER
   ========================================================== */
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

/* ==========================================================
   DYNAMIC BACKGROUND
   ========================================================== */
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
  weatherParticles.setWeather(type, isDay === 1);

  if (typeof weatherSoundscape !== "undefined" && weatherSoundscape) {
    weatherSoundscape.syncWithWeather(type, isDay === 1);
  }

  /* Sync light/dark to time of day */
  const isDark = isDay === 0;
  document.body.classList.toggle("dark-mode", isDark);
  themeSwitch.checked = isDark;
}

/* ==========================================================
   ████  DRAG & DROP — METRICS GRID
   ========================================================== */
const METRIC_ORDER_KEY = "mosamcheck_metric_order";
let draggedMetric = null;

function initDragDrop() {
  if (!metricsGrid) return;
  const items = metricsGrid.querySelectorAll(".metric");

  items.forEach((item) => {
    item.addEventListener("dragstart", onDragStart);
    item.addEventListener("dragover", onDragOver);
    item.addEventListener("drop", onDrop);
    item.addEventListener("dragend", onDragEnd);
    item.addEventListener("dragenter", onDragEnter);
    item.addEventListener("dragleave", onDragLeave);
  });
}

function onDragStart(e) {
  draggedMetric = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.metric);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function onDragEnter() {
  if (this !== draggedMetric) this.classList.add("drag-over");
}

function onDragLeave() {
  this.classList.remove("drag-over");
}

function onDrop(e) {
  e.preventDefault();
  if (this !== draggedMetric) {
    const parent = this.parentElement;
    const fromIdx = [...parent.children].indexOf(draggedMetric);
    const toIdx = [...parent.children].indexOf(this);
    if (fromIdx < toIdx) parent.insertBefore(draggedMetric, this.nextSibling);
    else parent.insertBefore(draggedMetric, this);
    saveMetricOrder();
  }
  this.classList.remove("drag-over");
}

function onDragEnd() {
  this.classList.remove("dragging");
  document
    .querySelectorAll(".metric")
    .forEach((m) => m.classList.remove("drag-over", "dragging"));
  draggedMetric = null;
}

function saveMetricOrder() {
  const order = [...metricsGrid.querySelectorAll(".metric")].map(
    (m) => m.dataset.metric,
  );
  localStorage.setItem(METRIC_ORDER_KEY, JSON.stringify(order));
}

function restoreMetricOrder() {
  try {
    const saved = localStorage.getItem(METRIC_ORDER_KEY);
    if (!saved) {
      initDragDrop();
      return;
    }
    const order = JSON.parse(saved);
    order.forEach((id) => {
      const el = metricsGrid.querySelector(`[data-metric="${id}"]`);
      if (el) metricsGrid.appendChild(el);
    });
  } catch {
    localStorage.removeItem(METRIC_ORDER_KEY);
  }
  initDragDrop();
}

/* ==========================================================
   SEO META TAGS
   ========================================================== */
function updateMetaTags(city, country, current) {
  const temp = Math.round(current.temp_c);
  const cond = current.condition.text;
  const title = `Weather in ${city}, ${country} — ${temp}°C, ${cond} | MosamCheck`;
  const desc = `Live weather in ${city}: ${temp}°C, ${cond}. Humidity ${current.humidity}%, Wind ${Math.round(current.wind_kph)} km/h.`;
  document.getElementById("pageTitle").textContent = title;
  setMeta("description", desc);
  setMeta("og:title", title, true);
  setMeta("og:description", desc, true);
}

function setMeta(name, content, isProperty = false) {
  const attr = isProperty ? `[property="${name}"]` : `[name="${name}"]`;
  const el = document.querySelector(`meta${attr}`);
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
const yearEl = document.getElementById("currentYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* URL query param: mosamcheck.me/?q=Lahore */
(function checkQueryParam() {
  const q = new URLSearchParams(window.location.search).get("q");
  if (q) setTimeout(() => fetchCoordinates(q), 500);
})();

/* ==========================================================
   27. AMBIENT WEATHER SOUNDSCAPE ENGINE (PROCEDURAL AUDIO)
   ========================================================== */
class WeatherSoundscape {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.activeNodes = [];
    this.activeIntervals = [];
    this.isPlaying = false;
    this.currentMode = "auto";
    this.liveWeatherType = "clear";
    this.isDay = true;
    this.volume = 0.5;

    this.btn = document.getElementById("soundBtn");
    this.panel = document.getElementById("soundPanel");
    this.icon = document.getElementById("soundIcon");
    this.pulse = document.getElementById("soundPulse");
    this.badge = document.getElementById("soundStatusBadge");
    this.desc = document.getElementById("soundConditionText");
    this.volumeInput = document.getElementById("soundVolume");
    this.presets = document.querySelectorAll(".preset-btn");

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.btn || !this.panel) return;

    this.btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSound();
    });

    document.addEventListener("click", (e) => {
      if (!this.panel.contains(e.target) && !this.btn.contains(e.target)) {
        this.panel.classList.add("hidden");
      }
    });

    if (this.volumeInput) {
      this.volumeInput.addEventListener("input", (e) => {
        this.volume = parseFloat(e.target.value) / 100;
        if (this.masterGain && this.audioCtx) {
          this.masterGain.gain.setTargetAtTime(
            this.volume,
            this.audioCtx.currentTime,
            0.05
          );
        }
      });
    }

    this.presets.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.presets.forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        this.currentMode = btn.dataset.sound;
        if (!this.isPlaying) {
          this.toggleSound(true);
        } else {
          this._playCurrentSound();
        }
      });
    });
  }

  _initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  toggleSound(forceState = null) {
    const shouldPlay = forceState !== null ? forceState : !this.isPlaying;
    if (shouldPlay) {
      this._initAudio();
      this.isPlaying = true;
      this.btn.classList.add("active");
      if (this.pulse) this.pulse.classList.remove("hidden");
      if (this.icon) this.icon.textContent = "🔊";
      if (this.badge) {
        this.badge.textContent = "ON";
        this.badge.className = "sound-badge on";
      }
      this.panel.classList.remove("hidden");
      this._playCurrentSound();
    } else {
      this.isPlaying = false;
      this._stopAllNodes();
      this.btn.classList.remove("active");
      if (this.pulse) this.pulse.classList.add("hidden");
      if (this.icon) this.icon.textContent = "🔇";
      if (this.badge) {
        this.badge.textContent = "OFF";
        this.badge.className = "sound-badge off";
      }
      if (this.desc) this.desc.textContent = "Soundscape muted";
    }
  }

  syncWithWeather(type, isDay) {
    this.liveWeatherType = type;
    this.isDay = isDay;
    if (this.isPlaying && this.currentMode === "auto") {
      this._playCurrentSound();
    }
  }

  _stopAllNodes() {
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.activeIntervals.forEach((id) => clearInterval(id));
    this.activeIntervals = [];
  }

  _playCurrentSound() {
    if (!this.isPlaying) return;
    this._stopAllNodes();
    this._initAudio();

    let activeSound = this.currentMode;
    if (activeSound === "auto") {
      if (this.liveWeatherType === "clear" && !this.isDay) {
        activeSound = "night";
      } else {
        activeSound = this.liveWeatherType;
      }
    }

    if (this.desc) {
      const descMap = {
        rain: "🌧️ Ambient gentle rainfall & droplets",
        thunder: "⛈️ Rolling storm rumbles & heavy rain",
        wind: "💨 Atmospheric wind turbulence & gusts",
        clear: "☀️ Serene warm harmonic drone pad",
        night: "🦗 Serene night ambience & chirps",
        snow: "🌨️ Soft muffled wind & crystal chimes",
        clouds: "🌥️ Soft atmospheric breeze & clouds",
      };
      this.desc.textContent = descMap[activeSound] || "🎧 Ambient sound active";
    }

    if (activeSound === "rain") this._createRainSound();
    else if (activeSound === "thunder") {
      this._createRainSound();
      this._createThunderLoop();
    } else if (activeSound === "wind" || activeSound === "clouds") {
      this._createWindSound();
    } else if (activeSound === "night") {
      this._createNightSound();
    } else {
      this._createSereneDrone();
    }
  }

  _createNoiseBuffer(duration = 2) {
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  _createRainSound() {
    const buffer = this._createNoiseBuffer(3);
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 850;
    filter.Q.value = 0.8;

    const rainGain = this.audioCtx.createGain();
    rainGain.gain.value = 0.35;

    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise);
  }

  _createThunderLoop() {
    const triggerThunder = () => {
      if (!this.isPlaying) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      const now = this.audioCtx.currentTime;

      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 3.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 4.2);
      this.activeNodes.push(osc);
    };

    const interval = setInterval(triggerThunder, 8000);
    this.activeIntervals.push(interval);
  }

  _createWindSound() {
    const buffer = this._createNoiseBuffer(3);
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 380;
    filter.Q.value = 3.5;

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 220;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = this.audioCtx.createGain();
    windGain.gain.value = 0.3;

    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, lfo);
  }

  _createSereneDrone() {
    const now = this.audioCtx.currentTime;
    const freqs = [130.81, 164.81, 196.00, 246.94];
    freqs.forEach((f, idx) => {
      const osc = this.audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;

      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.08;

      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.value = 0.1 + idx * 0.05;
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      lfo.start(now);
      this.activeNodes.push(osc, lfo);
    });
  }

  _createNightSound() {
    this._createSereneDrone();
    const osc = this.audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 4200;

    const gain = this.audioCtx.createGain();
    gain.gain.value = 0.03;

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 14;
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    lfo.start();
    this.activeNodes.push(osc, lfo);
  }
}

const weatherSoundscape = new WeatherSoundscape();

/* ==========================================================
   28. 3D CARD PARALLAX TILT & SPECULAR GLINT CONTROLLER
   ========================================================== */
function init3DTilt() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const tiltCards = document.querySelectorAll(".glass-card, .glass-metric, .forecast-card");
  tiltCards.forEach((card) => {
    if (card._hasTiltListener) return;
    card._hasTiltListener = true;

    if (!card.querySelector(".card-glint")) {
      const glint = document.createElement("div");
      glint.className = "card-glint";
      card.appendChild(glint);
    }

    const maxTilt = card.classList.contains("glass-metric") ? 10 : 5;

    card.addEventListener("mousemove", (e) => {
      if (card.classList.contains("dragging") || (typeof draggedMetric !== "undefined" && draggedMetric !== null)) return;

      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

      const rotateX = (-y * maxTilt).toFixed(2);
      const rotateY = (x * maxTilt).toFixed(2);

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      card.style.setProperty("--glint-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--glint-y", `${e.clientY - rect.top}px`);
      card.style.setProperty("--glint-opacity", "1");
    });

    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      card.style.setProperty("--glint-opacity", "0");
      setTimeout(() => {
        card.style.transition = "";
      }, 400);
    });
  });
}

window.addEventListener("DOMContentLoaded", init3DTilt);

