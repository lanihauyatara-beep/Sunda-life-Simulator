// Web Audio API synthesized sound effects (Sundanese pentatonic chimes, UI clicks, horns, adzan bell)

class SoundEngine {
  private ctx: AudioContext | null = null;
  public sfxVolume = 0.8;
  public musicVolume = 0.8;
  public ambientVolume = 0.8;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.12,
    delay = 0
  ) {
    if (this.sfxVolume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const vol = Math.max(0.001, gainLevel * this.sfxVolume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public click() {
    this.playTone(540, 0.07, 'triangle', 0.1);
  }

  public confirm() {
    // Sundanese Pelog-inspired warm two-note chime
    this.playTone(523.25, 0.11, 'triangle', 0.12, 0);
    this.playTone(659.25, 0.16, 'triangle', 0.14, 0.07);
  }

  public cash() {
    this.playTone(880, 0.09, 'sine', 0.13, 0);
    this.playTone(1174.66, 0.18, 'sine', 0.15, 0.07);
  }

  public error() {
    this.playTone(220, 0.12, 'sawtooth', 0.08, 0);
    this.playTone(175, 0.16, 'sawtooth', 0.08, 0.1);
  }

  public prayerBell() {
    // Serene mosque chime
    this.playTone(392, 0.35, 'sine', 0.14, 0);
    this.playTone(523.25, 0.4, 'sine', 0.12, 0.2);
    this.playTone(659.25, 0.55, 'sine', 0.14, 0.42);
  }

  public crash() {
    this.playTone(110, 0.28, 'sawtooth', 0.22, 0);
    this.playTone(75, 0.35, 'square', 0.18, 0.06);
  }

  public horn() {
    this.playTone(340, 0.12, 'sawtooth', 0.08, 0);
    this.playTone(420, 0.14, 'sawtooth', 0.08, 0.13);
  }

  public angklungSuccess() {
    // Warm traditional Sundanese pentatonic arpeggio
    const notes = [440, 523.25, 587.33, 783.99, 880];
    notes.forEach((f, idx) => {
      this.playTone(f, 0.22, 'triangle', 0.1, idx * 0.07);
    });
  }
}

export const soundEngine = new SoundEngine();
