/**
 * MosamCheck — Weather Particle System
 * Handles canvas background particle animations (rain, snow, stars, lightning).
 */

"use strict";

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

const weatherParticles = new WeatherParticles();
