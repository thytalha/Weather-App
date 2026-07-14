/**
 * MosamCheck — Interactive Temperature Chart
 * Handles SVG/Canvas drawing, animations, hover tooltip, and touch support for 24-hour temperature curve.
 */

"use strict";

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

let tempChart = null;
