export const FRUITS = Object.freeze([
  { name: 'Kiraz', radius: 23, color: 0xdc3449, weight: 0 },
  { name: 'Çilek', radius: 32, color: 0xf35355, weight: 1 },
  { name: 'Üzüm', radius: 45, color: 0xa57bda, weight: 2 },
  { name: 'Portakal', radius: 63, color: 0xffaa38, weight: 4 },
  { name: 'Elma', radius: 89, color: 0xe46442, weight: 8 },
  { name: 'Karpuz', radius: 125, color: 0x8db85b, weight: 16 },
]);

export const MODES = Object.freeze([
  {
    count: 10,
    name: 'Küçük bahçe',
    description: 'Kısa ve tatlı',
    coefficient: 0.09278410299035045,
  },
  {
    count: 15,
    name: 'Bereketli bahçe',
    description: 'Biraz daha keşif',
    coefficient: 0.04474252077497673,
  },
  {
    count: 20,
    name: 'Büyük hasat',
    description: 'Daha çok birleşme',
    coefficient: 0.027721788748419476,
  },
]);

export const GAME = Object.freeze({
  width: 560,
  height: 656,
  left: 74,
  right: 486,
  floor: 584,
  rim: 132,
  danger: 157,
  spawnY: 66,
  gravity: 1.15,
  stepMs: 1000 / 60,
  dropIntervalMs: 850,
  settleMinMs: 1500,
  settleMaxMs: 10000,
  overflowGraceMs: 1800,
  overflowHoldMs: 1200,
  payoutCap: 5,
  targetRtp: 0.96,
  finalMergeWeight: 32,
  startingBalance: 100_000,
});

export function getMode(count) {
  const mode = MODES.find((item) => item.count === count);
  if (!mode) throw new RangeError('Geçersiz meyve modu.');
  return mode;
}
