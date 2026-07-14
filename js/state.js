/**
 * MosamCheck — Application State & DOM References
 */

"use strict";

/* Application State Variables */
let currentUnit = "C";
let currentSpeedUnit = "kph";
let lastWeatherData = null;
let debounceTimer = null;
let alertDismissed = false;
let currentAlertIdx = 0;
let allAlerts = [];

/* DOM References */
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
