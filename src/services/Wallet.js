import { GAME } from '../config/game.js';

const KEY = 'fruitfall:wallet:v1';

function initialState() {
  return { version: 1, balance: GAME.startingBalance, pending: null, history: [] };
}

export class Wallet {
  constructor(storage) {
    this.storage = storage;
    if (!storage) {
      try {
        this.storage = globalThis.localStorage;
      } catch {
        this.storage = null;
      }
    }
    this.state = this.read();
    this.recovered = false;
    if (this.state.pending) {
      this.settle({ reason: 'interrupted', merges: 0 });
      this.recovered = true;
    }
  }

  read() {
    try {
      const value = JSON.parse(this.storage.getItem(KEY));
      if (
        value?.version !== 1 ||
        !Number.isSafeInteger(value.balance) ||
        value.balance < 0 ||
        !Array.isArray(value.history)
      )
        return initialState();
      if (
        value.pending &&
        (!Number.isSafeInteger(value.pending.cost) ||
          !Number.isSafeInteger(value.pending.payout) ||
          value.pending.cost <= 0 ||
          value.pending.payout < 0 ||
          value.pending.payout > value.pending.cost * GAME.payoutCap ||
          ![10, 15, 20].includes(value.pending.count))
      )
        return initialState();
      value.history = value.history
        .filter(
          (round) =>
            Number.isSafeInteger(round.count) &&
            [10, 15, 20].includes(round.count) &&
            Number.isSafeInteger(round.cost) &&
            round.cost > 0 &&
            Number.isSafeInteger(round.payout) &&
            round.payout >= 0 &&
            round.payout <= round.cost * GAME.payoutCap &&
            Number.isSafeInteger(round.merges) &&
            round.merges >= 0 &&
            Number.isFinite(round.finishedAt),
        )
        .slice(0, 100);
      return value;
    } catch {
      return initialState();
    }
  }

  save() {
    try {
      this.storage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      /* The game remains playable when browser storage is unavailable. */
    }
  }

  reserve({ id, cost, count, seed }) {
    if (this.state.pending) throw new Error('Devam eden bir tur var.');
    if (!Number.isSafeInteger(cost) || cost <= 0) throw new Error('Geçersiz mod ücreti.');
    if (this.state.balance < cost) throw new Error('Bu mod için yeterli sanal jetonun yok.');
    this.state.balance -= cost;
    this.state.pending = { id, cost, count, seed, payout: 0, createdAt: Date.now() };
    this.save();
  }

  updatePayout(payout) {
    const pending = this.state.pending;
    if (!pending) return;
    if (
      !Number.isSafeInteger(payout) ||
      payout < pending.payout ||
      payout > pending.cost * GAME.payoutCap
    ) {
      throw new RangeError('Geçersiz tur ödülü.');
    }
    pending.payout = payout;
    this.save();
  }

  settle({ reason, merges }) {
    const pending = this.state.pending;
    if (!pending) return null;
    const result = { ...pending, reason, merges, finishedAt: Date.now() };
    this.state.balance += pending.payout;
    this.state.history = [result, ...this.state.history].slice(0, 100);
    this.state.pending = null;
    this.save();
    return result;
  }

  addDemoTokens() {
    if (this.state.pending) throw new Error('Önce devam eden turu tamamla.');
    this.state.balance += GAME.startingBalance;
    this.save();
  }

  get balance() {
    return this.state.balance;
  }
  get history() {
    return this.state.history;
  }
}
