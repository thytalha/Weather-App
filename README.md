# 🌦️ Weather Dashboard: Real-Time Forecasts

**Stay ahead of the storm. A clean, responsive weather experience.**

<div align="center">
  <img src="https://img.shields.io/badge/Author-Talha%20Pasha-orange?style=for-the-badge" alt="Author">
  <img src="https://img.shields.io/badge/Language-HTML5-E34F26?style=for-the-badge&logo=html5" alt="HTML5">
  <img src="https://img.shields.io/badge/Style-CSS3-1572B6?style=for-the-badge&logo=css3" alt="CSS3">
  <img src="https://img.shields.io/badge/Logic-JavaScript-F7DF1E?style=for-the-badge&logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/Status-In--Progress-yellow?style=for-the-badge" alt="Status">
</div>

**_Sample Screenshot of the Dashboard 👇👇_**
![Weather Dashboard Screenshot](assets/sample.png)

---

# 🌤️ Dynamic Weather Dashboard

A responsive, feature-rich weather application built with vanilla web technologies. This dashboard provides real-time weather metrics, detailed forecasts, and a highly interactive UI that dynamically adapts its theme and background based on current weather conditions and time of day.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Features

- **Real-Time Weather Metrics:** Displays accurate temperature, humidity, wind speed, atmospheric pressure, UV index, and sunrise/sunset times.
- **Granular Forecasts:** Includes a scrolling 12-hour forecast and a comprehensive 7-day outlook with max/min temps and rain probability.
- **Smart Location Detection:** \* Uses the browser's Geolocation API to fetch local weather automatically on load.
  - Includes a search bar powered by the OpenStreetMap Nominatim API for accurate city-to-coordinate geocoding.
  - Built-in rapid routing for specific local cities (e.g., Garh More, Garh Maharaja).
- **Dynamic UI & Theming:**
  - **Auto-Theming:** Automatically switches between Light and Dark mode based on the `is_day` data from the API. Manual toggle also available.
  - **Animated Backgrounds:** The CSS background runs a smooth gradient animation that shifts colors based on weather conditions (Clear, Clouds, Rain, Thunder).
- **Responsive Design:** Utilizes CSS Grid and Flexbox to ensure seamless scaling from desktop down to mobile viewports.

## 🏗️ Professional Modular Architecture

To maintain enterprise-grade separation of concerns and maintainability, the project is structured into modular domain-specific files without relying on complex build steps or bundlers:

```
Weather-App/
├── index.html                  # Main application dashboard & layout
├── css/
│   ├── style.css               # Main CSS hub (@importing all base, layout & component modules)
│   ├── base/                   # Core tokens, resets, animations, responsive design
│   │   ├── variables.css       # Design system tokens & theme color definitions
│   │   ├── reset.css           # Modern box-sizing reset & base element typography
│   │   ├── animations.css      # Keyframe animations & UI micro-interactions
│   │   ├── responsive.css      # Tablet & mobile media queries
│   │   └── accessibility.css   # Focus states & custom scrollbar styling
│   ├── layout/                 # Structural page layout components
│   │   ├── main.css            # Main container, loading spinner & error card layout
│   │   └── footer.css          # Site footer styling
│   └── components/             # UI widget modules
│       ├── canvas.css          # Weather canvas container
│       ├── aurora.css          # Aurora borealis background animation
│       ├── glass-card.css      # Glassmorphism surface & blur effects
│       ├── alert-banner.css    # Emergency weather alert banner
│       ├── navigation.css      # Site header, autocomplete search & toggles
│       ├── current-weather.css # Primary hero temperature & condition display
│       ├── metrics-grid.css    # Drag-and-drop weather metrics grid
│       ├── aqi.css             # US EPA Air Quality Index dial & pollutant bars
│       ├── chart.css           # 24-hour interactive temperature & rain SVG chart
│       ├── hourly-cards.css    # 12-hour scrolling forecast cards
│       ├── forecast-cards.css  # 3-day weekly forecast cards
│       ├── soundscape.css      # Web Audio API soundscape control panel
│       └── parallax-tilt.css   # 3D mouse tracking tilt & specular glint
├── js/
│   ├── config.js               # API keys, EPA tables & local city coordinates
│   ├── state.js                # Global runtime state & DOM element registry
│   ├── ui-helpers.js           # Ripple button effects, SEO dynamic meta & utilities
│   ├── units.js                # Metric/Imperial unit conversion logic (°C/°F, km/h/mph)
│   ├── particles.js            # Canvas procedural weather particle engine
│   ├── soundscape.js           # Web Audio API procedural ambient weather audio engine
│   ├── chart.js                # Interactive 24-hour SVG temperature forecast chart
│   ├── theme.js                # Dark/Light theme manager with localStorage persistence
│   ├── search.js               # Nominatim OpenStreetMap autocomplete search & query handlers
│   ├── api.js                  # WeatherAPI endpoint communication & geolocation fetchers
│   ├── render.js               # UI binding & card renderer functions
│   ├── drag-drop.js            # Drag-and-drop metrics customization grid
│   ├── parallax-tilt.js        # 3D interactive mouse tracking parallax & specular glint
│   └── app.js                  # DOMContentLoaded initializer & query parameter parser
├── assets/
│   ├── favicon_new.png         # High-resolution site icon
│   └── sample.png              # Preview screenshot for social sharing
├── .gitignore                  # Git ignore rules for node_modules, logs, and OS files
├── .editorconfig               # Cross-IDE code formatting consistency rules
├── CONTRIBUTING.md             # Contribution guidelines and workflow
├── CHANGELOG.md                # Semantic versioning history
└── LICENSE                     # MIT Open Source License
```

## 🛠️ Tech Stack & APIs

- **Frontend:** HTML5, CSS3 (CSS Variables, Grid, Animations), Vanilla JavaScript (ES6+).
- **Weather Data:** [WeatherAPI](https://www.weatherapi.com/) (`v1/forecast.json`).
- **Geocoding:** [OpenStreetMap Nominatim API](https://nominatim.org/).

# 🚀 Setup, Deployment & License

## Clone the repository:

```bash
git clone [https://github.com/thytalha/weather-dashboard.git](https://github.com/thytalha/weather-dashboard.git)
cd weather-dashboard
```

## Configure the API Key & Run:

Open `script.js` and locate the `API_KEY` constant at the top of the file to insert your valid WeatherAPI key. Since this is a vanilla frontend application, you can simply open `index.html` in your web browser to run it. For the best development experience, use a local server like VS Code's "Live Server" extension.

## 🌐 Deployment:

This app is entirely static and client-side, making it perfect for rapid deployment on platforms like **Vercel**, Netlify, or GitHub Pages. Simply link your repository to your preferred hosting platform and deploy the root directory.

## 📄 License:

&copy; 2026 Talha. All Rights Reserved.
