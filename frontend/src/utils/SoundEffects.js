/**
 * SoundEffects.js — Procedural Sci-Fi UI Sounds
 * 
 * Uses Web Audio API to generate sounds on the fly.
 * No external assets required.
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        // Initialize on first user interaction to bypass autoplay policy
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playTone({ freq, type, duration, vol = 0.1, slide = 0 }) {
        if (!this.initialized) this.init();
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slide !== 0) {
            osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // ── Presets ──────────────────────────────────────────────────────────────

    // Hover: High pitch, very short, pure sine
    playHover() {
        // Very subtle "tic"
        this.playTone({ freq: 800, type: 'sine', duration: 0.05, vol: 0.02 });
    }

    // Click: Sharp, mechanical
    playClick() {
        this.playTone({ freq: 1200, type: 'triangle', duration: 0.08, vol: 0.05, slide: -600 });
    }

    // Activate: Rising "power up"
    playActivate() {
        this.playTone({ freq: 200, type: 'sine', duration: 0.4, vol: 0.1, slide: 800 });
    }

    // Alert: Low pulsing saw
    playAlert() {
        this.playTone({ freq: 150, type: 'sawtooth', duration: 0.3, vol: 0.08, slide: -50 });
    }
}

export const soundManager = new SoundManager();
