/**
 * MosamCheck — Procedural Ambient Audio Engine
 * Uses Web Audio API to generate synthetic soothing soundscapes (rain, thunder, wind, drone) without external audio files.
 */

"use strict";

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
      if (this.btn) this.btn.classList.add("active");
      if (this.pulse) this.pulse.classList.remove("hidden");
      if (this.icon) this.icon.textContent = "🔊";
      if (this.badge) {
        this.badge.textContent = "ON";
        this.badge.className = "sound-badge on";
      }
      if (this.panel) this.panel.classList.remove("hidden");
      this._playCurrentSound();
    } else {
      this.isPlaying = false;
      this._stopAllNodes();
      if (this.btn) this.btn.classList.remove("active");
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
