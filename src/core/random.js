/** Seeded randomness keeps fruit selection independent of frame rate and balance. */
export class Random {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  next() {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  between(min, max) {
    return min + this.next() * (max - min);
  }

  fruitLevel() {
    const value = this.next();
    return value < 0.5 ? 0 : value < 0.8 ? 1 : 2;
  }
}
