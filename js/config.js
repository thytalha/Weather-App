/**
 * MosamCheck — Configuration Constants
 */

"use strict";

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
