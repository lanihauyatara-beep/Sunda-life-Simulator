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
  private indoorRainTimerId: number | null = null;
  private thunderTimerId: number | null = null;
  private lastThunderAt = 0;
  private lastEnvState: EnvironmentAudioState | null = null;
  private isAudioUnlocked = false;
  private adzanAudio: HTMLAudioElement | null = null;
  private bedukTimerId: number | null = null;
  private cricketsAudio: HTMLAudioElement | null = null;
  private roosterAudio: HTMLAudioElement | null = null;
  private lastRoosterPlayedAt = 0;

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

  public unlock() {
    this.ensureContext();
    this.isAudioUnlocked = true;
    if (this.lastEnvState) {
      this.updateEnvironment(this.lastEnvState);
    }
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

  private computeCricketsVolume(state: EnvironmentAudioState): number {
    if (!state.active || this.ambientVolume <= 0.01) return 0;
    if (state.weather === 'hujan') return 0;
    const hour = ((state.minutesOfDay / 60) % 24 + 24) % 24;
    const isNight = hour >= 18.0 || hour < 5.0;
    if (!isNight) return 0;

    let base = state.isIndoor ? 0.14 : 0.36;
    if (state.sceneId === 'hutan_tutupan' || state.sceneId === 'sawah_lisung') {
      base = 0.44;
    } else if (state.sceneId === 'pasar') {
      base = 0.18;
    }
    if (state.weather === 'gerimis') {
      base *= 0.55;
    }
    return Math.max(0, Math.min(1, base * this.ambientVolume));
  }

  private updateCricketsLayer(state: EnvironmentAudioState) {
    if (typeof window === 'undefined') return;
    const targetVol = this.computeCricketsVolume(state);

    if (targetVol <= 0.005) {
      if (this.cricketsAudio && !this.cricketsAudio.paused) {
        this.cricketsAudio.pause();
      }
      return;
    }

    try {
      if (!this.cricketsAudio) {
        this.cricketsAudio = new Audio('/audio/crickets.mp3');
        this.cricketsAudio.loop = true;
        this.cricketsAudio.preload = 'auto';
      }
      this.cricketsAudio.volume = targetVol;
      if (this.cricketsAudio.paused) {
        const p = this.cricketsAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            // Will resume on next user interaction / unlock
          });
        }
      }
    } catch {
      // ignore audio element error
    }
  }

  /**
   * Plays authentic morning village rooster crowing (/audio/rooster.mp3)
   */
  public playRooster(scale = 1) {
    if (typeof window === 'undefined') return;
    const volScale = Math.max(this.ambientVolume, this.sfxVolume * 0.45);
    if (volScale <= 0.01) return;
    const nowMs = Date.now();
    if (nowMs - this.lastRoosterPlayedAt < 6000) return;
    this.lastRoosterPlayedAt = nowMs;

    try {
      if (!this.roosterAudio) {
        this.roosterAudio = new Audio('/audio/rooster.mp3');
        this.roosterAudio.preload = 'auto';
      }
      this.roosterAudio.currentTime = 0;
      this.roosterAudio.volume = Math.max(0, Math.min(1, 0.46 * volScale * scale));
      const p = this.roosterAudio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // ignore autoplay block
        });
      }
    } catch {
      // ignore audio element error
    }
  }

  public stopMorningAndNightRealAudio() {
    if (this.cricketsAudio && !this.cricketsAudio.paused) {
      this.cricketsAudio.pause();
    }
    if (this.roosterAudio && !this.roosterAudio.paused) {
      this.roosterAudio.pause();
      this.roosterAudio.currentTime = 0;
    }
  }

  public syncVolumes() {
    if (this.adzanAudio) {
      this.adzanAudio.volume = Math.max(0, Math.min(1, this.sfxVolume));
    }
    if (this.lastEnvState) {
      this.updateCricketsLayer(this.lastEnvState);
    }
    if (this.roosterAudio && !this.roosterAudio.paused) {
      const volScale = Math.max(this.ambientVolume, this.sfxVolume * 0.45);
      const indoorFactor = this.lastEnvState?.isIndoor ? 0.45 : 1;
      this.roosterAudio.volume = Math.max(0, Math.min(1, 0.46 * volScale * indoorFactor));
    }
    if (!this.ctx || !this.ambientMasterGain) return;
    const target = this.lastEnvState?.active ? this.ambientVolume : 0;
    this.ambientMasterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
    if (this.ambientVolume <= 0.01) {
      this.stopIndoorRainScheduler();
      this.stopThunderScheduler();
    } else if (this.lastEnvState?.active && this.isAudioUnlocked) {
      this.syncDynamicWeatherSchedulers(this.lastEnvState);
    }
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

    // Real night crickets audio loop (/audio/crickets.mp3)
    this.updateCricketsLayer(state);

    // Real morning rooster crowing (/audio/rooster.mp3) when dawn/morning arrives (04.30 - 08.30 WIB)
    if (state.active && state.weather !== 'hujan') {
      const hour = ((state.minutesOfDay / 60) % 24 + 24) % 24;
      const prevHour = prev ? ((prev.minutesOfDay / 60) % 24 + 24) % 24 : -1;
      const isMorning = hour >= 4.5 && hour < 8.5;
      const enteredMorning = isMorning && (!prev?.active || prevHour < 4.5 || prevHour >= 8.5);
      if (enteredMorning) {
        this.playRooster(state.isIndoor ? 0.45 : 0.95);
      }
    } else if (!state.active) {
      this.stopMorningAndNightRealAudio();
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
      this.stopIndoorRainScheduler();
      this.stopThunderScheduler();
      this.stopPasarTicker();
      return;
    }

    this.ambientMasterGain?.gain.setTargetAtTime(this.ambientVolume, now, 0.25);

    // 1. Rain Loop Intensification (synchronized smoothly with 1.8s visual rain transition)
    let rainTargetGain = 0;
    let rainTargetFreq = 1800;
    if (state.weather === 'hujan') {
      rainTargetGain = state.isIndoor ? 0.088 : 0.22;
      rainTargetFreq = state.isIndoor ? 980 : 3500;
    } else if (state.weather === 'gerimis') {
      rainTargetGain = state.isIndoor ? 0.042 : 0.085;
      rainTargetFreq = state.isIndoor ? 820 : 2300;
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
    } else {
      // Cozy indoor room tone
      sceneTargetGain = 0.005;
      sceneTargetFreq = 260;
      sceneTargetQ = 0.9;
    }

    this.sceneGain?.gain.setTargetAtTime(sceneTargetGain, now, 0.45);
    this.sceneFilter?.frequency.setTargetAtTime(sceneTargetFreq, now, 0.45);
    this.sceneFilter?.Q.setTargetAtTime(sceneTargetQ, now, 0.45);

    this.ensureAmbientTicker();
    this.syncDynamicWeatherSchedulers(state, prev?.weather !== state.weather);
  }

  private playIndoorRaindrop(weather: WeatherCondition, sceneId: SceneId) {
    if (!this.isAudioUnlocked || this.ambientVolume <= 0.01) return;
    if (!this.ensureAmbientGraph() || !this.ctx || !this.ambientMasterGain) return;

    const ctx = this.ctx;
    const isWarung = sceneId === 'warung_interior' || sceneId === 'warung_asih';
    const count = weather === 'hujan' ? (Math.random() < 0.45 ? 3 : 2) : Math.random() < 0.35 ? 2 : 1;

    for (let i = 0; i < count; i++) {
      const delay = i * (0.045 + Math.random() * 0.095);
      const t0 = ctx.currentTime + delay;

      // 1. Crisp roof-tile / window-pane raindrop micro-patter
      const dropDur = 0.032 + Math.random() * 0.034;
      const src = ctx.createBufferSource();
      src.buffer = this.getNoiseBuffer(ctx);
      src.loop = true;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      const baseFreq = isWarung ? 1750 + Math.random() * 1450 : 1350 + Math.random() * 1250;
      bp.frequency.setValueAtTime(baseFreq, t0);
      bp.Q.setValueAtTime(2.4 + Math.random() * 1.4, t0);

      const nGain = ctx.createGain();
      const baseVol = weather === 'hujan' ? 0.034 : 0.022;
      const peak = baseVol * (0.7 + Math.random() * 0.65);
      nGain.gain.setValueAtTime(0.0001, t0);
      nGain.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dropDur);

      src.connect(bp);
      bp.connect(nGain);
      nGain.connect(this.ambientMasterGain);
      src.start(t0, Math.random() * 2.2);
      src.stop(t0 + dropDur + 0.02);

      // 2. Subtle hollow genteng / wooden eave resonance ping on select drops
      if (Math.random() < (weather === 'hujan' ? 0.65 : 0.8)) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const pitch = (isWarung ? 640 : 510) + Math.random() * 620;
        osc.frequency.setValueAtTime(pitch, t0);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.72, t0 + 0.045);

        const pGain = ctx.createGain();
        const pPeak = (weather === 'hujan' ? 0.015 : 0.012) * (0.7 + Math.random() * 0.6);
        pGain.gain.setValueAtTime(0.0001, t0);
        pGain.gain.exponentialRampToValueAtTime(pPeak, t0 + 0.004);
        pGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.048);

        osc.connect(pGain);
        pGain.connect(this.ambientMasterGain);
        osc.start(t0);
        osc.stop(t0 + 0.06);
      }
    }
  }

  private scheduleNextIndoorRaindrop() {
    if (typeof window === 'undefined') return;
    const env = this.lastEnvState;
    if (
      !env ||
      !env.active ||
      !env.isIndoor ||
      (env.weather !== 'gerimis' && env.weather !== 'hujan') ||
      this.ambientVolume <= 0.01
    ) {
      this.indoorRainTimerId = null;
      return;
    }

    const delayMs =
      env.weather === 'hujan'
        ? 95 + Math.random() * 210
        : 240 + Math.random() * 480;

    this.indoorRainTimerId = window.setTimeout(() => {
      this.indoorRainTimerId = null;
      const latest = this.lastEnvState;
      if (
        !latest ||
        !latest.active ||
        !latest.isIndoor ||
        (latest.weather !== 'gerimis' && latest.weather !== 'hujan')
      ) {
        return;
      }
      if (this.isAudioUnlocked && this.ambientVolume > 0.01) {
        this.playIndoorRaindrop(latest.weather, latest.sceneId);
      }
      this.scheduleNextIndoorRaindrop();
    }, delayMs);
  }

  private stopIndoorRainScheduler() {
    if (this.indoorRainTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.indoorRainTimerId);
      this.indoorRainTimerId = null;
    }
  }

  /**
   * Dynamic randomized-duration thunder strike (supports outdoor intensity & realistic indoor roof muffling)
   */
  public playThunder(isIndoor = false, weather: WeatherCondition = 'hujan') {
    if (this.ambientVolume <= 0.01 || !this.isAudioUnlocked) return;
    if (!this.ensureAmbientGraph() || !this.ctx || !this.ambientMasterGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.lastThunderAt = Date.now();

    // Random duration (2.4s .. 7.0s for hujan, slightly shorter for gerimis/mendung)
    const totalDuration =
      weather === 'hujan'
        ? 2.6 + Math.random() * 4.4
        : weather === 'gerimis'
        ? 2.2 + Math.random() * 3.4
        : 2.0 + Math.random() * 2.8;

    const baseIntensity =
      weather === 'hujan'
        ? 0.55 + Math.random() * 0.45
        : weather === 'gerimis'
        ? 0.34 + Math.random() * 0.34
        : 0.24 + Math.random() * 0.26;

    const indoorScale = isIndoor ? 0.64 : 1.0;
    const cutoffScale = isIndoor ? 0.68 : 1.0;
    const masterOut = this.ambientMasterGain;

    // Layer 1: Optional sharp cloud crack on stronger strikes
    if (baseIntensity > 0.56) {
      const crackDur = 0.26 + Math.random() * 0.26;
      const cSrc = ctx.createBufferSource();
      cSrc.buffer = this.getNoiseBuffer(ctx);
      cSrc.loop = true;

      const cFilter = ctx.createBiquadFilter();
      cFilter.type = 'bandpass';
      cFilter.frequency.setValueAtTime((isIndoor ? 460 : 980) + Math.random() * 350, now);
      cFilter.frequency.exponentialRampToValueAtTime(110, now + crackDur);
      cFilter.Q.setValueAtTime(0.95, now);

      const cGain = ctx.createGain();
      const cPeak = (isIndoor ? 0.045 : 0.11) * baseIntensity;
      cGain.gain.setValueAtTime(0.0001, now);
      cGain.gain.exponentialRampToValueAtTime(cPeak, now + 0.035);
      cGain.gain.exponentialRampToValueAtTime(0.0001, now + crackDur);

      cSrc.connect(cFilter);
      cFilter.connect(cGain);
      cGain.connect(masterOut);
      cSrc.start(now, Math.random() * 1.5);
      cSrc.stop(now + crackDur + 0.03);
    }

    // Layer 2: Primary rolling thunder boom + 1-2 mountain valley echoes across totalDuration
    const rollCount = totalDuration > 4.6 ? 3 : 2;
    for (let r = 0; r < rollCount; r++) {
      const offsetRatio = r === 0 ? 0.04 : r === 1 ? 0.3 + Math.random() * 0.16 : 0.54 + Math.random() * 0.14;
      const tStart = now + totalDuration * offsetRatio;
      const rollDur = Math.max(1.1, totalDuration * (1 - offsetRatio));
      const rollDecay = r === 0 ? 1 : r === 1 ? 0.68 : 0.44;

      const rSrc = ctx.createBufferSource();
      rSrc.buffer = this.getNoiseBuffer(ctx);
      rSrc.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      const startCutoff = (210 + Math.random() * 90 - r * 35) * cutoffScale;
      const endCutoff = Math.max(32, (48 + Math.random() * 18) * cutoffScale);
      lp.frequency.setValueAtTime(startCutoff, tStart);
      lp.frequency.exponentialRampToValueAtTime(endCutoff, tStart + rollDur);
      lp.Q.setValueAtTime(0.85, tStart);

      const rGain = ctx.createGain();
      const peak = 0.27 * baseIntensity * indoorScale * rollDecay;
      const attack = Math.min(0.45, rollDur * 0.2);
      rGain.gain.setValueAtTime(0.0001, tStart);
      rGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), tStart + attack);
      rGain.gain.exponentialRampToValueAtTime(0.0001, tStart + rollDur);

      rSrc.connect(lp);
      lp.connect(rGain);
      rGain.connect(masterOut);
      rSrc.start(tStart, (Math.random() * 2.1) % 2.8);
      rSrc.stop(tStart + rollDur + 0.05);
    }

    // Layer 3: Sub-bass pressure rumble (felt lightly even inside the house/warung)
    const subDur = Math.min(2.8, totalDuration * 0.56);
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(48 + Math.random() * 12, now);
    subOsc.frequency.exponentialRampToValueAtTime(27, now + subDur);

    const subLp = ctx.createBiquadFilter();
    subLp.type = 'lowpass';
    subLp.frequency.setValueAtTime(75, now);

    const subGain = ctx.createGain();
    const subPeak = 0.085 * baseIntensity * indoorScale;
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(Math.max(0.001, subPeak), now + 0.22);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + subDur);

    subOsc.connect(subLp);
    subLp.connect(subGain);
    subGain.connect(masterOut);
    subOsc.start(now);
    subOsc.stop(now + subDur + 0.04);
  }

  private scheduleNextThunder(quickInitial = false) {
    if (typeof window === 'undefined') return;
    const env = this.lastEnvState;
    if (
      !env ||
      !env.active ||
      (env.weather !== 'hujan' && env.weather !== 'gerimis' && env.weather !== 'mendung') ||
      this.ambientVolume <= 0.01
    ) {
      this.thunderTimerId = null;
      return;
    }

    let delayMs: number;
    if (quickInitial && env.weather === 'hujan' && Date.now() - this.lastThunderAt > 10000) {
      delayMs = 2200 + Math.random() * 3200;
    } else if (env.weather === 'hujan') {
      delayMs = 8500 + Math.random() * 14500;
    } else if (env.weather === 'gerimis') {
      delayMs = 15000 + Math.random() * 23000;
    } else {
      delayMs = 23000 + Math.random() * 31000;
    }

    this.thunderTimerId = window.setTimeout(() => {
      this.thunderTimerId = null;
      const latest = this.lastEnvState;
      if (
        !latest ||
        !latest.active ||
        (latest.weather !== 'hujan' && latest.weather !== 'gerimis' && latest.weather !== 'mendung')
      ) {
        return;
      }
      if (this.isAudioUnlocked && this.ambientVolume > 0.01) {
        this.playThunder(latest.isIndoor, latest.weather);
      }
      this.scheduleNextThunder(false);
    }, delayMs);
  }

  private stopThunderScheduler() {
    if (this.thunderTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.thunderTimerId);
      this.thunderTimerId = null;
    }
  }

  private syncDynamicWeatherSchedulers(state: EnvironmentAudioState, weatherChanged = false) {
    if (!state.active || this.ambientVolume <= 0.01) {
      this.stopIndoorRainScheduler();
      this.stopThunderScheduler();
      return;
    }

    // Indoor raindrop patter scheduler (active indoors during gerimis or hujan)
    const shouldPlayIndoorDrops =
      state.isIndoor && (state.weather === 'gerimis' || state.weather === 'hujan');
    if (shouldPlayIndoorDrops) {
      if (this.indoorRainTimerId === null) {
        this.scheduleNextIndoorRaindrop();
      }
    } else {
      this.stopIndoorRainScheduler();
    }

    // Occasional randomized thunder scheduler (active in hujan, gerimis, or mendung — both outdoor & indoor)
    const canThunder =
      state.weather === 'hujan' || state.weather === 'gerimis' || state.weather === 'mendung';
    if (canThunder) {
      if (weatherChanged && state.weather === 'hujan') {
        this.stopThunderScheduler();
        this.scheduleNextThunder(true);
      } else if (this.thunderTimerId === null) {
        this.scheduleNextThunder(state.weather === 'hujan');
      }
    } else {
      this.stopThunderScheduler();
    }
  }

  private ensureAmbientTicker() {
    if (typeof window === 'undefined' || this.ambientTickerId !== null) return;
    this.ambientTickerId = window.setInterval(() => {
      const env = this.lastEnvState;
      if (!env || !env.active || this.ambientVolume <= 0.01 || !this.isAudioUnlocked) return;

      const hour = ((env.minutesOfDay / 60) % 24 + 24) % 24;
      const isNight = hour >= 18.0 || hour < 5.0;
      const isMorning = hour >= 4.5 && hour < 8.5;

      // Ensure real cricket audio keeps running smoothly at night if unlocked after entering night
      if (isNight) {
        this.updateCricketsLayer(env);
      }

      // Pasar accents are handled by the dedicated setPasarAmbience / ensurePasarTicker engine
      if (env.sceneId === 'pasar') return;

      // Real morning village rooster crowing periodically during early morning (04.30 - 08.30 WIB)
      if (isMorning && env.weather !== 'hujan' && Date.now() - this.lastRoosterPlayedAt >= 26000) {
        if (Math.random() < 0.55) {
          this.playRooster(env.isIndoor ? 0.45 : 0.9);
          return;
        }
      }

      // Forest & river subtle daytime bird chirps
      if (!env.isIndoor && env.weather !== 'hujan') {
        if (
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
    }, 3500);
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

  private triggerSingleBedukHit(delay = 0, intensity = 1) {
    if (this.sfxVolume <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t0 = ctx.currentTime + delay;
    const scale = Math.max(0.05, this.sfxVolume * intensity);

    // 1. Deep cowhide drum membrane sub-bass punch (66 Hz -> 37 Hz)
    const skinOsc = ctx.createOscillator();
    skinOsc.type = 'sine';
    skinOsc.frequency.setValueAtTime(72, t0);
    skinOsc.frequency.exponentialRampToValueAtTime(37, t0 + 0.18);

    const skinGain = ctx.createGain();
    skinGain.gain.setValueAtTime(0.0001, t0);
    skinGain.gain.linearRampToValueAtTime(0.55 * scale, t0 + 0.012);
    skinGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.85);

    // 2. Hollow wooden beduk cylinder body resonance (~116 Hz -> 94 Hz)
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(124, t0);
    bodyOsc.frequency.exponentialRampToValueAtTime(92, t0 + 0.22);

    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(280, t0);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0001, t0);
    bodyGain.gain.linearRampToValueAtTime(0.28 * scale, t0 + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);

    // 3. Soft wooden mallet thud transient
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.getNoiseBuffer(ctx);
    const malletFilter = ctx.createBiquadFilter();
    malletFilter.type = 'bandpass';
    malletFilter.frequency.setValueAtTime(240, t0);
    malletFilter.Q.setValueAtTime(1.4, t0);
    const malletGain = ctx.createGain();
    malletGain.gain.setValueAtTime(0.0001, t0);
    malletGain.gain.linearRampToValueAtTime(0.22 * scale, t0 + 0.008);
    malletGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);

    // Gentle mosque courtyard echo
    const delayNode = ctx.createDelay(0.8);
    delayNode.delayTime.setValueAtTime(0.22, t0);
    const echoGain = ctx.createGain();
    echoGain.gain.setValueAtTime(0.22, t0);

    skinOsc.connect(skinGain);
    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    noiseSrc.connect(malletFilter);
    malletFilter.connect(malletGain);

    skinGain.connect(ctx.destination);
    bodyGain.connect(ctx.destination);
    malletGain.connect(ctx.destination);

    skinGain.connect(delayNode);
    bodyGain.connect(delayNode);
    delayNode.connect(echoGain);
    echoGain.connect(ctx.destination);

    skinOsc.start(t0);
    bodyOsc.start(t0);
    noiseSrc.start(t0, 0.2);

    skinOsc.stop(t0 + 0.9);
    bodyOsc.stop(t0 + 0.6);
    noiseSrc.stop(t0 + 0.18);
  }

  /**
   * Authentic Indonesian/Sundanese mosque Beduk drum cadence ("DUG... DUG... DUG-DUG-DUG")
   */
  public playBeduk(fullCadence = true) {
    if (this.sfxVolume <= 0.01) return;
    this.triggerSingleBedukHit(0.0, 0.95);
    this.triggerSingleBedukHit(0.55, 1.0);
    if (fullCadence) {
      this.triggerSingleBedukHit(1.1, 0.88);
      this.triggerSingleBedukHit(1.36, 0.95);
      this.triggerSingleBedukHit(1.62, 1.05);
    }
  }

  public stopAdzan() {
    if (this.bedukTimerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.bedukTimerId);
      this.bedukTimerId = null;
    }
    if (this.adzanAudio) {
      this.adzanAudio.pause();
      this.adzanAudio.currentTime = 0;
    }
  }

  /**
   * Plays authentic Sunda mosque Beduk prelude followed by real recorded Adzan audio (/audio/adzan.mp3)
   */
  public playAdzan() {
    if (this.sfxVolume <= 0.01 || typeof window === 'undefined') return;
    this.stopAdzan();

    // 1. Two resonant Beduk mosque beats as the traditional call prelude
    this.playBeduk(false);

    // 2. Real human-recited Adzan recording after the 2nd beduk resonance
    this.bedukTimerId = window.setTimeout(() => {
      this.bedukTimerId = null;
      if (this.sfxVolume <= 0.01) return;
      try {
        if (!this.adzanAudio) {
          this.adzanAudio = new Audio('/audio/adzan.mp3');
          this.adzanAudio.preload = 'auto';
        }
        this.adzanAudio.currentTime = 0;
        this.adzanAudio.volume = Math.max(0, Math.min(1, this.sfxVolume));
        const p = this.adzanAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            // If autoplay blocked, finish with warm beduk cadence so prayer cue is still clear
            this.playBeduk(true);
          });
        }
      } catch {
        this.playBeduk(true);
      }
    }, 950);
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
