// Midnight Vault — synthesised sound with WebAudio.
// No audio files: every effect is an oscillator or filtered noise built at
// run time. The context is created on the first user gesture; M mutes.
export function createAudio() {
  const audio = {
    context: null,
    muted: false,
    master: null,
    ensure() {
      if (this.context) {
        if (this.context.state === 'suspended') void this.context.resume();
        return;
      }
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        this.context = new Ctx();
        this.master = this.context.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.context.destination);
      } catch {
        this.context = null;
      }
    },
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
      return this.muted;
    },
    // One short oscillator blip.
    tone(freq, duration, type = 'sine', volume = 0.5, slideTo = null) {
      if (!this.context || this.muted) return;
      try {
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      } catch {
        // Sound is decoration; a failure must never break the game.
      }
    },
    // Filtered noise burst (footsteps, coin clink, EMP zap).
    noise(duration, filterFreq, volume = 0.4) {
      if (!this.context || this.muted) return;
      try {
        const now = this.context.currentTime;
        const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
        const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        source.start(now);
      } catch {
        // Sound is decoration; a failure must never break the game.
      }
    },
    step() { this.noise(0.07, 500, 0.12); },
    coin() {
      this.tone(1900, 0.12, 'triangle', 0.4, 2600);
      this.noise(0.08, 3200, 0.15);
    },
    grabLoot() {
      this.tone(660, 0.12, 'sine', 0.5);
      setTimeout(() => this.tone(880, 0.14, 'sine', 0.5), 90);
      setTimeout(() => this.tone(1320, 0.22, 'sine', 0.45), 180);
    },
    emp() {
      this.noise(0.4, 1800, 0.4);
      this.tone(1200, 0.35, 'sawtooth', 0.25, 120);
    },
    spotted() {
      this.tone(440, 0.18, 'square', 0.35, 660);
      setTimeout(() => this.tone(660, 0.18, 'square', 0.35, 440), 160);
    },
    alarmLoop() { this.tone(520, 0.5, 'sawtooth', 0.22, 780); },
    caught() {
      this.tone(320, 0.5, 'sawtooth', 0.4, 90);
      setTimeout(() => this.tone(220, 0.7, 'sawtooth', 0.35, 70), 300);
    },
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => setTimeout(() => this.tone(freq, 0.25, 'triangle', 0.45), i * 130));
    },
    unlock() {
      this.tone(980, 0.15, 'triangle', 0.4);
      setTimeout(() => this.tone(1470, 0.25, 'triangle', 0.4), 120);
    },
  };
  return audio;
}
