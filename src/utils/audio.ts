// Web Audio API synthesized sound effects & contextual environmental ambient engine
// 100% procedural Web Audio (works offline in PWA mode with zero external audio assets)

import { SceneId, WeatherCondition } from '../types/game';

interface EnvironmentAudioState {
  active: boolean;
  sceneId: SceneId;
  isIndoor: boolean;
  weather: WeatherCondition;
  minutesOfDay: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  public sfxVolume = 0.8;
  public musicVolume = 0.8;
  public ambientVolume = 0.8;

  private noiseBuffer: AudioBuffer | null = null;
  private ambientMasterGain: GainNode | null = null;

  // Looping rain bed
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;

  // Looping contextual scene ambient bed (pasar hubbub, river, wind, room tone)
  private sceneSource: AudioBufferSourceNode | null = null;
  private sceneFilter: BiquadFilterNode | null = null;
  private sceneGain: GainNode | null = null;

  // Dedicated Pasar Tradisional crowd chatter layer (riuh pedagang)
  private pasarChatterSource: AudioBufferSourceNode | null = null;
  private pasarChatterFilter: BiquadFilterNode | null = null;
  private pasarChatterGain: GainNode | null = null;
  private pasarLfo: OscillatorNode | null = null;
  private pasarLfoGain: GainNode | null = null;
  private pasarActive = false;
  private pasarProximity = 1;
  private pasarMinutesOfDay = 540;
  private pasarTickerId: number | null = null;

  private ambientTickerId: number | null = null;
  private lastEnvState: EnvironmentAudioState | null = null;
  private isAudioUnlocked = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.isAudioUnlocked = true;
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    // 3-second smooth pink-ish noise buffer for rain, river, wind, and crowd beds
    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      data[i] = Math.max(-1, Math.min(1, pink));
    }
    // Crossfade start & end 256 samples for seamless loop
    const fadeSamples = Math.min(512, Math.floor(length / 10));
    for (let i = 0; i < fadeSamples; i++) {
      const t = i / fadeSamples;
      const tailIdx = length - fadeSamples + i;
      const blended = data[i] * t + data[tailIdx] * (1 - t);
      data[i] = blended;
      data[tailIdx] = blended;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private ensureAmbientGraph(): boolean {
    const ctx = this.ensureContext();
    if (!ctx) return false;
    if (this.ambientMasterGain && this.rainGain && this.sceneGain) return true;

    const noise = this.getNoiseBuffer(ctx);
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(this.ambientVolume, now);
    master.connect(ctx.destination);
    this.ambientMasterGain = master;

    // 1. Rain Ambient Channel
    const rSrc = ctx.createBufferSource();
    rSrc.buffer = noise;
    rSrc.loop = true;
    const rFilter = ctx.createBiquadFilter();
    rFilter.type = 'lowpass';
    rFilter.frequency.setValueAtTime(2200, now);
    rFilter.Q.setValueAtTime(0.6, now);
    const rGain = ctx.createGain();
    rGain.gain.setValueAtTime(0, now);
    rSrc.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(master);
    rSrc.start(now);

    this.rainSource = rSrc;
    this.rainFilter = rFilter;
    this.rainGain = rGain;

    // 2. Scene / Marketplace / Nature Ambient Channel
    const sSrc = ctx.createBufferSource();
    sSrc.buffer = noise;
    sSrc.loop = true;
    const sFilter = ctx.createBiquadFilter();
    sFilter.type = 'bandpass';
    sFilter.frequency.setValueAtTime(480, now);
    sFilter.Q.setValueAtTime(0.9, now);
    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0, now);
    sSrc.connect(sFilter);
    sFilter.connect(sGain);
    sGain.connect(master);
    sSrc.start(now);

    this.sceneSource = sSrc;
    this.sceneFilter = sFilter;
    this.sceneGain = sGain;

    // 3. Dedicated Pasar Crowd Murmur Channel (higher formant chatter with gentle organic ebb/flow LFO)
    const pSrc = ctx.createBufferSource();
    pSrc.buffer = noise;
    pSrc.loop = true;
    const pFilter = ctx.createBiquadFilter();
    pFilter.type = 'bandpass';
    pFilter.frequency.setValueAtTime(860, now);
    pFilter.Q.setValueAtTime(1.15, now);
    const pGain = ctx.createGain();
    pGain.gain.setValueAtTime(0, now);

    const pLfo = ctx.createOscillator();
    pLfo.type = 'sine';
    pLfo.frequency.setValueAtTime(0.28, now);
    const pLfoGain = ctx.createGain();
    pLfoGain.gain.setValueAtTime(0, now);

    pLfo.connect(pLfoGain);
    pLfoGain.connect(pGain.gain);
    pSrc.connect(pFilter);
    pFilter.connect(pGain);
    pGain.connect(master);
    pSrc.start(now, 0.75);
    pLfo.start(now);

    this.pasarChatterSource = pSrc;
    this.pasarChatterFilter = pFilter;
    this.pasarChatterGain = pGain;
    this.pasarLfo = pLfo;
    this.pasarLfoGain = pLfoGain;

    return true;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.12,
    delay = 0,
    useAmbientBus = false
  ) {
    const volumeScale = useAmbientBus ? this.ambientVolume : this.sfxVolume;
    if (volumeScale <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const vol = Math.max(0.0005, gainLevel * volumeScale);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playFilteredNoiseBurst(
    duration: number,
    filterType: BiquadFilterType,
    freqStart: number,
    freqEnd: number,
    q: number,
    gainPeak: number,
    delay = 0,
    useAmbientBus = false
  ) {
    const volumeScale = useAmbientBus ? this.ambientVolume : this.sfxVolume;
    if (volumeScale <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freqStart, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);
    filter.Q.setValueAtTime(q, now);

    const gain = ctx.createGain();
    const peak = Math.max(0.0005, gainPeak * volumeScale);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.18, duration * 0.28));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(now, Math.random() * 1.8);
    src.stop(now + duration + 0.03);
  }

  public syncVolumes() {
    if (!this.ctx || !this.ambientMasterGain) return;
    const target = this.lastEnvState?.active ? this.ambientVolume : 0;
    this.ambientMasterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
  }

  public updateEnvironment(state: EnvironmentAudioState) {
    const prev = this.lastEnvState;
    this.lastEnvState = state;

    // Trigger contextual transition cue if weather changed during active outdoor gameplay
    if (
      prev &&
      prev.active &&
      state.active &&
      prev.weather !== state.weather &&
      this.isAudioUnlocked
    ) {
      this.rainTransition(prev.weather, state.weather, state.isIndoor);
    }

    if (!this.ensureAmbientGraph() || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (!state.active) {
      this.ambientMasterGain?.gain.setTargetAtTime(0, now, 0.25);
      this.rainGain?.gain.setTargetAtTime(0, now, 0.25);
      this.sceneGain?.gain.setTargetAtTime(0, now, 0.25);
      this.pasarChatterGain?.gain.setTargetAtTime(0, now, 0.25);
      this.pasarLfoGain?.gain.setTargetAtTime(0, now, 0.25);
      this.stopAmbientTicker();
      this.stopPasarTicker();
      return;
    }

    this.ambientMasterGain?.gain.setTargetAtTime(this.ambientVolume, now, 0.25);

    // 1. Rain Loop Intensification (synchronized smoothly with 1.8s visual rain transition)
    let rainTargetGain = 0;
    let rainTargetFreq = 1800;
    if (state.weather === 'hujan') {
      rainTargetGain = state.isIndoor ? 0.065 : 0.22;
      rainTargetFreq = state.isIndoor ? 780 : 3500;
    } else if (state.weather === 'gerimis') {
      rainTargetGain = state.isIndoor ? 0.024 : 0.085;
      rainTargetFreq = state.isIndoor ? 650 : 2300;
    }
    this.rainGain?.gain.setTargetAtTime(rainTargetGain, now, 0.58);
    this.rainFilter?.frequency.setTargetAtTime(rainTargetFreq, now, 0.58);

    // 2. Scene / Location Ambient Loop
    let sceneTargetGain = 0.006;
    let sceneTargetFreq = 450;
    let sceneTargetQ = 1.0;

    if (state.sceneId === 'pasar') {
      // Subtle warm marketplace bustle & crowd murmur
      const hour = state.minutesOfDay / 60;
      const busyFactor = hour >= 6 && hour <= 17 ? 1 : 0.45;
      sceneTargetGain = 0.055 * busyFactor;
      sceneTargetFreq = 520;
      sceneTargetQ = 0.75;
    } else if (state.sceneId === 'area_air') {
      // Flowing mountain river & bamboo fountain babble
      sceneTargetGain = 0.075;
      sceneTargetFreq = 760;
      sceneTargetQ = 1.15;
    } else if (state.sceneId === 'hutan_tutupan' || state.sceneId === 'sawah_lisung') {
      // Highland breeze over ricefields & bamboo forest
      sceneTargetGain = 0.032;
      sceneTargetFreq = 340;
      sceneTargetQ = 1.45;
    } else if (!state.isIndoor) {
      // Calm village outdoor air
      sceneTargetGain = 0.016;
      sceneTargetFreq = 360;
      sceneTargetQ = 1.2;
    }

    this.sceneGain?.gain.setTargetAtTime(sceneTargetGain, now, 0.45);
    this.sceneFilter?.frequency.setTargetAtTime(sceneTargetFreq, now, 0.45);
    this.sceneFilter?.Q.setTargetAtTime(sceneTargetQ, now, 0.45);

    this.ensureAmbientTicker();
  }

  private ensureAmbientTicker() {
    if (typeof window === 'undefined' || this.ambientTickerId !== null) return;
    this.ambientTickerId = window.setInterval(() => {
      const env = this.lastEnvState;
      if (!env || !env.active || this.ambientVolume <= 0.01 || !this.isAudioUnlocked) return;

      const hour = env.minutesOfDay / 60;
      const isNight = hour >= 18.5 || hour < 5.0;

      // Pasar accents are handled by the dedicated setPasarAmbience / ensurePasarTicker engine
      if (env.sceneId === 'pasar') return;

      // River & forest subtle bird chirps / night crickets
      if (!env.isIndoor && env.weather !== 'hujan') {
        if (isNight && Math.random() < 0.45) {
          // Subtle Sundanese village evening cricket trill
          const baseFreq = 3200 + Math.random() * 400;
          this.playTone(baseFreq, 0.045, 'sine', 0.012, 0, true);
          this.playTone(baseFreq + 90, 0.045, 'sine', 0.011, 0.07, true);
          this.playTone(baseFreq, 0.05, 'sine', 0.01, 0.14, true);
        } else if (
          !isNight &&
          (env.sceneId === 'hutan_tutupan' ||
            env.sceneId === 'sawah_lisung' ||
            env.sceneId === 'area_air') &&
          Math.random() < 0.35
        ) {
          // Gentle village bird chirp
          const f1 = 1550 + Math.random() * 350;
          this.playTone(f1, 0.07, 'sine', 0.014, 0, true);
          this.playTone(f1 * 1.18, 0.08, 'sine', 0.012, 0.08, true);
        }
      }
    }, 2800);
  }

  private stopAmbientTicker() {
    if (this.ambientTickerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.ambientTickerId);
      this.ambientTickerId = null;
    }
  }

  private playVocalFormantSyllable(
    pitchStart: number,
    pitchEnd: number,
    formantFreq: number,
    duration: number,
    gainPeak: number,
    delay = 0
  ) {
    if (this.ambientVolume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitchStart, now);
    osc.frequency.linearRampToValueAtTime(pitchEnd, now + duration);

    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(formantFreq, now);
    formant.Q.setValueAtTime(4.2, now);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1650, now);

    const gain = ctx.createGain();
    const vol = Math.max(0.0005, gainPeak * this.ambientVolume * this.pasarProximity);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + Math.min(0.04, duration * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(formant);
    formant.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /**
   * Simulates soft background tawar-menawar (buyer inquiry + seller warm reply) in Pasar Sunda
   */
  public playPasarBargain() {
    if (!this.isAudioUnlocked || this.ambientVolume <= 0.01) return;
    // Buyer rising inflection ("Sabaraha, Mang?")
    const bPitch = 195 + Math.random() * 35;
    this.playVocalFormantSyllable(bPitch, bPitch * 1.08, 720, 0.14, 0.022, 0);
    this.playVocalFormantSyllable(bPitch * 1.05, bPitch * 1.24, 880, 0.17, 0.024, 0.17);

    // Seller calm descending response ("Mangga, mirah...")
    const sPitch = 135 + Math.random() * 25;
    this.playVocalFormantSyllable(sPitch * 1.06, sPitch * 0.96, 620, 0.16, 0.024, 0.48);
    this.playVocalFormantSyllable(sPitch, sPitch * 0.88, 560, 0.22, 0.022, 0.67);
  }

  /**
   * Simulates distant vendor friendly call & market commotion bursts (riuh pedagang)
   */
  private playPasarVendorCall() {
    if (!this.isAudioUnlocked || this.ambientVolume <= 0.01) return;
    const base = 165 + Math.random() * 55;
    this.playVocalFormantSyllable(base, base * 1.12, 780, 0.15, 0.02, 0);
    this.playVocalFormantSyllable(base * 1.15, base * 0.92, 690, 0.24, 0.022, 0.18);
  }

  public setPasarAmbience(enabled: boolean, minutesOfDay = 540, stallProximity = 1) {
    this.pasarActive = enabled;
    this.pasarMinutesOfDay = minutesOfDay;
    this.pasarProximity = Math.max(0.55, Math.min(1.25, stallProximity));

    if (!this.ensureAmbientGraph() || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (!enabled) {
      this.pasarChatterGain?.gain.setTargetAtTime(0, now, 0.35);
      this.pasarLfoGain?.gain.setTargetAtTime(0, now, 0.35);
      this.stopPasarTicker();
      return;
    }

    const hour = (minutesOfDay / 60) % 24;
    const busyFactor = hour >= 6 && hour <= 17 ? 1 : 0.45;
    const baseChatter = 0.036 * busyFactor * this.pasarProximity;
    this.pasarChatterFilter?.frequency.setTargetAtTime(
      840 + (this.pasarProximity - 0.6) * 220,
      now,
      0.4
    );
    this.pasarChatterGain?.gain.setTargetAtTime(baseChatter, now, 0.45);
    this.pasarLfoGain?.gain.setTargetAtTime(baseChatter * 0.28, now, 0.45);

    this.ensurePasarTicker();
  }

  private ensurePasarTicker() {
    if (typeof window === 'undefined' || this.pasarTickerId !== null) return;
    this.pasarTickerId = window.setInterval(() => {
      if (!this.pasarActive || !this.isAudioUnlocked || this.ambientVolume <= 0.01) return;
      const hour = (this.pasarMinutesOfDay / 60) % 24;
      const busyChance = hour >= 6 && hour <= 17 ? 1 : 0.45;
      const roll = Math.random();

      if (roll < 0.36 * busyChance) {
        // Tawar-menawar antar pembeli dan pedagang
        this.playPasarBargain();
      } else if (roll < 0.62 * busyChance) {
        // Teriakan / panggilan ramah pedagang lapak pasar
        this.playPasarVendorCall();
      } else if (roll < 0.82) {
        // Suara keranjang bambu / peti kayu & riuh obrolan
        this.playFilteredNoiseBurst(0.11, 'bandpass', 960, 620, 2.4, 0.038 * this.pasarProximity, 0, true);
        this.playFilteredNoiseBurst(0.5, 'bandpass', 480, 680, 1.9, 0.028 * this.pasarProximity, 0.08, true);
      } else {
        // Denting timbangan / koin belanja pedagang
        this.playTone(1040 + Math.random() * 140, 0.12, 'sine', 0.018 * this.pasarProximity, 0, true);
        this.playTone(1380 + Math.random() * 120, 0.14, 'sine', 0.014 * this.pasarProximity, 0.07, true);
      }
    }, 2100);
  }

  private stopPasarTicker() {
    if (this.pasarTickerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.pasarTickerId);
      this.pasarTickerId = null;
    }
  }

  public rainTransition(
    fromWeather: WeatherCondition,
    toWeather: WeatherCondition,
    isIndoor = false
  ) {
    if (this.ambientVolume <= 0.01 && this.sfxVolume <= 0.01) return;
    if (toWeather === 'hujan' && fromWeather !== 'hujan') {
      // Rain intensifying swell + soft distant thunder rumble
      this.playFilteredNoiseBurst(
        1.7,
        'lowpass',
        isIndoor ? 180 : 320,
        isIndoor ? 95 : 140,
        1.2,
        isIndoor ? 0.07 : 0.14,
        0,
        true
      );
      this.playFilteredNoiseBurst(
        1.4,
        'bandpass',
        900,
        isIndoor ? 1100 : 2400,
        0.9,
        isIndoor ? 0.04 : 0.1,
        0.2,
        true
      );
    } else if (toWeather === 'gerimis' && (fromWeather === 'cerah' || fromWeather === 'terik' || fromWeather === 'mendung')) {
      // Soft initial raindrop patter swell
      this.playFilteredNoiseBurst(
        1.1,
        'bandpass',
        1400,
        2100,
        1.1,
        isIndoor ? 0.025 : 0.065,
        0,
        true
      );
    } else if (
      (fromWeather === 'hujan' || fromWeather === 'gerimis') &&
      (toWeather === 'mendung' || toWeather === 'cerah' || toWeather === 'terik')
    ) {
      // Rain clearing gentle breeze
      this.playFilteredNoiseBurst(1.0, 'bandpass', 720, 420, 1.5, 0.04, 0, true);
    }
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

  public doorChime() {
    // Soft wooden sliding door & brass warung bell
    this.playFilteredNoiseBurst(0.16, 'bandpass', 500, 320, 1.8, 0.08, 0);
    this.playTone(784, 0.18, 'triangle', 0.08, 0.05);
    this.playTone(1046.5, 0.22, 'sine', 0.06, 0.12);
  }

  public splashWater() {
    // Water splash / bamboo fountain scoop
    this.playFilteredNoiseBurst(0.32, 'bandpass', 1800, 650, 1.4, 0.14, 0);
    this.playTone(390, 0.09, 'sine', 0.07, 0.02);
    this.playTone(520, 0.1, 'sine', 0.05, 0.08);
  }

  public rustleLeaves() {
    // Leafy branch & basket rustle during fruit picking / forest foraging
    this.playFilteredNoiseBurst(0.24, 'highpass', 1600, 2600, 0.9, 0.1, 0);
    this.playFilteredNoiseBurst(0.18, 'bandpass', 1100, 1800, 1.3, 0.08, 0.08);
  }

  public cookingSizzle() {
    // Kitchen pan sizzle / warm drink pour
    this.playFilteredNoiseBurst(0.45, 'highpass', 2400, 1800, 0.8, 0.09, 0);
    this.playTone(310, 0.12, 'triangle', 0.06, 0.15);
    this.playTone(465, 0.14, 'sine', 0.06, 0.25);
  }

  public marketDepart(vehicleName: string) {
    const lower = vehicleName.toLowerCase();
    if (lower.includes('angkot') || lower.includes('ojek') || lower.includes('motor')) {
      this.horn();
    } else {
      // Delman bell / becak ring
      this.playTone(987.77, 0.12, 'sine', 0.1, 0);
      this.playTone(1318.51, 0.16, 'sine', 0.09, 0.09);
    }
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
