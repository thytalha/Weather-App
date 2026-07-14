/**
 * MosamCheck — 3D Card Parallax Tilt & Specular Glint Controller
 * Adds depth animations and light reflections to glassmorphism cards on desktop devices.
 */

"use strict";

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
