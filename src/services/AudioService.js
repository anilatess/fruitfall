/** Small synthesized sounds keep the download light and need no audio files. */
export class AudioService {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.lastSound = 0;
  }

  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) await this.unlock();
    return this.enabled;
  }

  async unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      this.enabled = false;
    }
  }

  playMerge(level) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    if (now - this.lastSound < 0.065) return;
    this.lastSound = now;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    const frequency = 280 * 2 ** (level / 5);
    oscillator.frequency.setValueAtTime(frequency * 0.75, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency, now + 0.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  finish() {
    if (!this.enabled || !this.context) return;
    [0, 2, 4].forEach((level, index) => setTimeout(() => this.playMerge(level), index * 120));
  }

  destroy() {
    this.context?.close();
  }
}
