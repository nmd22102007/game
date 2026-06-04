/**
 * Procedural Web Audio API synthesizer for the Cyberpunk Gaming Hub.
 * Creates an immersive 8-bit / Neo-Synth sound experience entirely in code.
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private currentBgmSource: AudioScheduledSourceNode | null = null;
  private bgmIntervalId: any = null;
  private isMuted = false;
  
  // App-wide volumes
  public musicVolume = 0.5;
  public sfxVolume = 0.6;

  constructor() {
    // Lazy initialize when user interacts to bypass browser autoplay rules
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play standard click sound
   */
  public playClick() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * Jump sound for Love Runner
   */
  public playJump() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  /**
   * Coin collection sound (classic retro chord ding)
   */
  public playCoin() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const t = this.ctx.currentTime;
    
    // Quick dual high pitch
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.08 * this.sfxVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.005, start + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(988, t, 0.08); // B5
    playNote(1318, t + 0.07, 0.15); // E6
  }

  /**
   * Crash sound (noise filter sweep + low boom)
   */
  public playCrash() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const t = this.ctx.currentTime;

    // Bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.4);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);

    // Procedural white noise element
    try {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.35);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.35);
    } catch (e) {
      // Fallback if buffer creation fails
    }
  }

  /**
   * Victory fan-fare
   */
  public playVictory() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50]; // C major arpeggio
    const noteTime = 0.08;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const start = t + idx * noteTime;
      const dur = idx === notes.length - 1 ? 0.4 : 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.06 * this.sfxVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.005, start + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  }

  /**
   * Chess check sound (sharp, caution-inducing chord)
   */
  public playCheck() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const t = this.ctx.currentTime;
    const freqs = [311.13, 349.23]; // D#4, F4 - tense minor second feel
    
    freqs.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.07 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  /**
   * Chess checkmate
   */
  public playCheckmate() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const t = this.ctx.currentTime;
    const chords = [220, 277, 330, 440]; // A major
    chords.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 2, t + 0.6);

      gain.gain.setValueAtTime(0.06 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  /**
   * Skin unlock celestial tone
   */
  public playUnlock() {
    this.resume();
    if (!this.ctx || this.isMuted || this.sfxVolume === 0) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A major 7 arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const start = t + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.05 * this.sfxVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Starts playing a procedural cyberpunk, low-tempo ambient synth theme
   */
  public startMusic() {
    this.resume();
    if (this.currentBgmSource || this.bgmIntervalId) return; // Already running

    this.init();
    if (!this.ctx) return;

    let beatCount = 0;
    // Cyberpunk ambient sequence
    // A dark wave bass line: E2 (82.4Hz), G2 (98.0Hz), A2 (110.0Hz), C3 (130.8Hz)
    const baseMelody = [82.41, 82.41, 97.99, 97.99, 110.00, 110.00, 130.81, 110.00];
    const leadCap = [329.63, 392.00, 440.00, 523.25, 587.33, 440.00, 392.00, 329.63];

    const playStep = () => {
      if (!this.ctx || this.isMuted || this.musicVolume === 0) return;
      if (this.ctx.state === 'suspended') return;

      const t = this.ctx.currentTime;
      const stepIdx = beatCount % 8;
      const bassFreq = baseMelody[stepIdx];

      // 1. Play deep bass line synth
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassGain.gain.setValueAtTime(0.18 * this.musicVolume, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(t);
      bassOsc.stop(t + 0.52);

      // 2. Play subtle neon synth chord (on 0, 2, 4, 6)
      if (stepIdx % 2 === 0) {
        const root = bassFreq * 4; // Shift up 2 octaves
        const chordNotes = [root, root * 1.25, root * 1.5]; // Major chord triad approx
        chordNotes.forEach(f => {
          if (!this.ctx) return;
          const oscNode = this.ctx.createOscillator();
          const gainNode = this.ctx.createGain();
          oscNode.type = 'sine';
          oscNode.frequency.setValueAtTime(f, t);

          gainNode.gain.setValueAtTime(0.04 * this.musicVolume, t);
          gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

          oscNode.connect(gainNode);
          gainNode.connect(this.ctx.destination);
          oscNode.start(t);
          oscNode.stop(t + 0.82);
        });
      }

      // 3. Ambient high melody randomly
      if (stepIdx === 1 || stepIdx === 3 || stepIdx === 6) {
        if (Math.random() > 0.3) {
          const melodyOsc = this.ctx.createOscillator();
          const melodyGain = this.ctx.createGain();
          melodyOsc.type = 'sine';
          melodyOsc.frequency.setValueAtTime(leadCap[(stepIdx + Math.floor(Math.random() * 4)) % 8], t);
          
          melodyGain.gain.setValueAtTime(0.03 * this.musicVolume, t);
          melodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

          melodyOsc.connect(melodyGain);
          melodyGain.connect(this.ctx.destination);
          melodyOsc.start(t);
          melodyOsc.stop(t + 0.35);
        }
      }

      beatCount++;
    };

    // Run custom scheduler every 500ms
    this.bgmIntervalId = setInterval(playStep, 500);
  }

  public stopMusic() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.currentBgmSource = null;
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
  }
}

export const audio = new AudioService();
