# Contributing to MosamCheck — Real-Time Weather Dashboard

First off, thank you for considering contributing to **MosamCheck**! We welcome bug fixes, feature enhancements, documentation improvements, and design polish.

## 🚀 Getting Started

1. **Fork** this repository.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Weather-App.git
   cd Weather-App
   ```
3. Create a **feature branch**:
   ```bash
   git checkout -b feature/amazing-new-widget
   ```
4. Make your changes in the appropriate modular file (`js/`, `css/`, etc.).
5. **Test** your changes across Light and Dark themes by opening `index.html` directly in your browser.
6. **Commit** using our commit standards:
   ```bash
   git commit -m "feat: add UV exposure timer recommendations"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/amazing-new-widget
   ```
8. Open a **Pull Request** against the `main` branch.

---

## 🏗️ Modular Architecture & Project Layout

To maintain high standards of separation of concerns, the codebase is structured into modular component files:

```
Weather-App/
├── index.html                  # Main application dashboard entry point
├── css/
│   ├── style.css               # Hub stylesheet importing all base, layout & component modules
│   ├── base/                   # Design tokens, resets, animations, responsive rules
│   ├── layout/                 # Main page containers, loading screen, error card, footer
│   └── components/             # Self-contained UI components (glass cards, AQI dial, soundscape, etc.)
├── js/
│   ├── config.js               # API keys, EPA tables, local city coordinates
│   ├── state.js                # Global runtime state & DOM node registry
│   ├── ui-helpers.js           # Ripple button effects, SEO dynamic meta updates, utilities
│   ├── units.js                # Metric/Imperial unit conversion logic (°C/°F, km/h/mph)
│   ├── particles.js            # Canvas-based procedural weather particle engine
│   ├── soundscape.js           # Web Audio API procedural ambient weather audio engine
│   ├── chart.js                # Interactive 24-hour SVG temperature forecast chart
│   ├── theme.js                # Dark/Light theme manager with localStorage persistence
│   ├── search.js               # Nominatim OpenStreetMap autocomplete search & query handlers
│   ├── api.js                  # WeatherAPI endpoint communication & geolocation fetchers
│   ├── render.js               # UI binding & card renderer functions
│   ├── drag-drop.js            # Drag-and-drop metrics customization grid
│   ├── parallax-tilt.js        # 3D interactive mouse tracking parallax & specular glint
│   └── app.js                  # DOMContentLoaded initializer & query parameter parser
└── assets/
    └── images/                 # Favicons, preview mockups, and visual assets
```

---

## 📜 Code Style Guidelines

- **Vanilla Web Tech**: Keep code lightweight and dependency-free. No heavy frameworks or external UI libraries unless explicitly justified.
- **CSS Architecture**: Write component-specific styles inside their dedicated stylesheet in `css/components/` or `css/layout/`. Use CSS custom properties (`var(--name)`) from `css/base/variables.css` for consistent theming across Dark and Light modes.
- **JavaScript Structure**: Keep JS files focused on single responsibilities. Ensure all interactive components include proper ARIA attributes (`aria-label`, `role="region"`, `tabindex="0"`) for screen reader accessibility and keyboard navigation.

Thank you for contributing! 🌤️
