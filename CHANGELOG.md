# Changelog

All notable changes to **MosamCheck — Real-Time Weather Dashboard** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2024-07-14

### Changed
- **Architectural Refactoring**: Restructured monolithic codebase into a highly maintainable, professional modular architecture containing over 40 distinct files.
- **CSS Modularization**: Decomposed `style.css` into 20 focused stylesheets categorized under `css/base/`, `css/layout/`, and `css/components/`, imported cleanly via the main CSS hub.
- **JavaScript Modularization**: Decomposed `script.js` into 14 domain-driven modules (`config.js`, `state.js`, `particles.js`, `soundscape.js`, `chart.js`, `theme.js`, `search.js`, `api.js`, `render.js`, `drag-drop.js`, `parallax-tilt.js`, `app.js`).
- **Professional Project Configuration**: Added industry-standard `.gitignore`, `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `.editorconfig`.

---

## [1.3.0] — 2024-07-14

### Added
- **Persistent Theme Preference**: Integrated `localStorage` (`mosamcheck_theme_preference`) to store user theme selections across browser restarts and page reloads.
- **Dynamic Contrast Adaptation**: Upgraded `WeatherParticles` engine and lightning renderer to automatically adapt stroke widths and color opacities when switching between Light Mode and Dark Mode.

### Fixed
- Fixed an issue where searching for or selecting a city during daytime (`isDay === 1`) would automatically strip away Dark Mode and revert the user's selected theme back to Light Mode.

---

## [1.2.0] — 2024-07-14

### Added
- **Ambient Soundscape Engine**: Implemented a procedural Web Audio API engine (`WeatherSoundscape`) capable of synthesizing real-time audio for rain, thunder rumbles, wind gusts, serene drones, and night crickets.
- **Soundscape Interactive Control Panel**: Added volume slider and preset switcher (`Auto`, `Rain + Thunder`, `Windy Drizzle`, `Serene Calm`, `Night Crickets`) with automatic synchronization to live weather conditions.
- **3D Card Parallax Tilt & Glint**: Added interactive 3D perspective tilt (`perspective(1000px) rotateX/rotateY`) and dynamic specular glint lighting overlay tracking the mouse cursor across glass cards and metrics.

---

## [1.1.0] — 2024-07-01

### Added
- **Draggable Metrics Grid**: Enabled drag-and-drop customization and persistence (`localStorage`) for weather metrics (Humidity, Wind Speed, Pressure, UV Index).
- **Interactive SVG Temperature Chart**: Built a responsive 24-hour temperature and rainfall probability chart with crosshair tooltips.
- **Air Quality Index (AQI) Dial**: Added US EPA 6-tier gauge with animated SVG fill ring and individual pollutant concentration breakdown bars (`PM2.5`, `PM10`, `O3`, `NO2`).
- **Weather Alerts Banner**: Implemented real-time emergency weather alert notifications with multi-alert pagination (`Prev / Next`).
