import { GAME, getMode } from '../config/game.js';

/** All money-like values are integer hundredths of a virtual token. */
export function calculatePayout(score, costCents, coefficient) {
  if (
    ![score, costCents, coefficient].every(Number.isFinite) ||
    score < 0 ||
    costCents < 0 ||
    coefficient < 0
  ) {
    throw new RangeError('Ödül değerleri geçersiz.');
  }
  return Math.min(Math.round(score * costCents * coefficient), costCents * GAME.payoutCap);
}

export function payoutForMode(score, costCents, count) {
  return calculatePayout(score, costCents, getMode(count).coefficient);
}

export function formatTokens(cents, decimals = 2) {
  return (cents / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
