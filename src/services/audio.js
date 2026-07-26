(() => {
  "use strict";

  const FY = window.FY;
  class SynthAudio {
    constructor(enabled) {
      this.enabled = enabled;
      this.context = null;
      this.lastShotAt = 0;
    }

    unlock() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.context = new AudioContext();
      }
      if (this.context?.state === "suspended") this.context.resume();
    }

    tone(frequency, duration, type = "sine", volume = 0.035, glide = 0) {
      if (!this.enabled || !this.context) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (glide) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(30, frequency + glide),
          now + duration,
        );
      }
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    shot() {
      const now = performance.now();
      if (now - this.lastShotAt < 95) return;
      this.lastShotAt = now;
      this.tone(520, 0.045, "square", 0.012, 190);
    }

    enemyShot() {
      this.tone(180, 0.08, "sawtooth", 0.009, -50);
    }

    hit() {
      this.tone(90, 0.16, "sawtooth", 0.055, -40);
    }

    explosion(size = 1) {
      this.tone(120 / size, 0.12 + size * 0.05, "square", 0.025, -70);
    }

    graze() {
      this.tone(860, 0.035, "sine", 0.012, 120);
    }

    burst() {
      this.tone(145, 0.65, "sawtooth", 0.05, 750);
      setTimeout(() => this.tone(420, 0.4, "sine", 0.035, 400), 80);
    }

    lightning() {
      this.tone(70, 0.22, "square", 0.04, -25);
    }

    victory() {
      [330, 440, 554, 660].forEach((frequency, index) => {
        setTimeout(() => this.tone(frequency, 0.25, "triangle", 0.035, 80), index * 115);
      });
    }
  }

  FY.SynthAudio = SynthAudio;
})();
