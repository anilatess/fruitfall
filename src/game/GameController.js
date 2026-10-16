import { GAME } from '../config/game.js';
import { RoundSimulation } from '../core/RoundSimulation.js';
import { payoutForMode, formatTokens } from '../core/rewards.js';
import { FruitRenderer } from '../rendering/FruitRenderer.js';
import { Wallet } from '../services/Wallet.js';
import { AudioService } from '../services/AudioService.js';
import { GameView } from '../ui/GameView.js';

const STAKES = [1, 2, 5, 10];

/** Orchestrates the independent simulation, renderer, wallet and DOM view. */
export class GameController {
  constructor(root) {
    this.view = new GameView(root);
    this.wallet = new Wallet();
    this.audio = new AudioService();
    this.renderer = new FruitRenderer(this.view.elements['game-canvas']);
    this.simulation = new RoundSimulation({ onEvent: (event) => this.handleEvent(event) });
    this.selectedCount = 15;
    this.stakeIndex = 0;
    this.speed = 1;
    this.paused = false;
    this.ready = false;
    this.accumulator = 0;
    this.payout = 0;
    this.currentCost = 1500;
    this.abortController = new AbortController();
    this.tick = (ticker) => this.update(ticker.deltaMS);
    this.bindControls();
    this.refreshSelection();
    this.view.updateWallet(this.wallet);
  }

  get busy() {
    return ['dropping', 'settling'].includes(this.simulation.state);
  }

  async init() {
    try {
      await this.renderer.init();
      this.simulation.seedDisplay();
      this.renderer.sync(this.simulation.fruits, 1000);
      this.renderer.app.ticker.add(this.tick);
      this.ready = true;
      this.view.ready();
      if (this.wallet.recovered)
        this.view.toast('Yarım kalan turdaki birikmiş ödülün bakiyene eklendi.');
    } catch (error) {
      console.error('Fruitfall could not initialize:', error);
      this.view.showError();
    }
  }

  bindControls() {
    this.view.bindModes((count) => {
      if (this.busy) return;
      this.selectedCount = count;
      this.refreshSelection();
      if (this.simulation.state === 'finished') this.showIdleSelection();
    });
    this.view.on('stake-down', 'click', () => this.changeStake(-1));
    this.view.on('stake-up', 'click', () => this.changeStake(1));
    this.view.on('start-button', 'click', () => this.start());
    this.view.on('pause-button', 'click', () => this.setPaused(!this.paused));
    this.view.on('resume-button', 'click', () => this.setPaused(false));
    this.view.on('sound-button', 'click', async () =>
      this.view.setSound(await this.audio.toggle()),
    );
    this.view.on('speed-button', 'click', () => {
      this.speed = this.speed === 1 ? 2 : 1;
      this.view.elements['speed-button'].textContent = `${this.speed}×`;
    });
    this.view.on('add-tokens', 'click', () => {
      try {
        this.wallet.addDemoTokens();
        this.view.updateWallet(this.wallet);
        this.view.toast('Bakiyene 1.000 sanal jeton eklendi.');
      } catch (error) {
        this.view.toast(error.message);
      }
    });
    this.view.onDialogOpen = () => {
      if (this.busy) this.setPaused(true);
    };
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden && this.busy) this.setPaused(true);
      },
      { signal: this.abortController.signal },
    );
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.code !== 'Space' || !this.busy || event.repeat) return;
        if (event.target.closest('button, input, select, dialog, a')) return;
        event.preventDefault();
        this.setPaused(!this.paused);
      },
      { signal: this.abortController.signal },
    );
  }

  changeStake(direction) {
    if (this.busy) return;
    this.stakeIndex = Math.max(0, Math.min(STAKES.length - 1, this.stakeIndex + direction));
    this.refreshSelection();
    if (this.simulation.state === 'finished') this.showIdleSelection();
  }

  refreshSelection() {
    this.view.setSelection(this.selectedCount, STAKES[this.stakeIndex], this.busy);
  }

  showIdleSelection() {
    this.simulation.seedDisplay();
    this.renderer.clearEffects();
    this.renderer.sync(this.simulation.fruits, 1000);
    this.view.elements['round-result'].hidden = true;
    this.view.elements['idle-hint'].hidden = false;
    this.view.updateRound({ dropped: 0, totalDrops: this.selectedCount, merges: 0 }, 0, 1);
    this.view.setStatus('Hazır');
    this.view.elements['next-label'].textContent = 'Sıradaki';
    this.view.elements['next-fruits'].replaceChildren();
  }

  start() {
    if (!this.ready || this.busy) return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const cost = this.selectedCount * STAKES[this.stakeIndex] * 100;
    try {
      this.wallet.reserve({ id: crypto.randomUUID(), cost, count: this.selectedCount, seed });
    } catch (error) {
      this.view.toast(`${error.message} Oyun bilgilerinden ücretsiz jeton ekleyebilirsin.`);
      return;
    }
    this.currentCost = cost;
    this.payout = 0;
    this.accumulator = 0;
    this.paused = false;
    this.view.setPaused(false);
    this.renderer.clearEffects();
    this.simulation.start({ count: this.selectedCount, seed });
    this.view.setBusy(true);
    this.refreshSelection();
    this.view.updateWallet(this.wallet);
    this.view.updateRound(this.simulation.snapshot(), 0, cost);
    this.view.showNext(this.simulation.sequence, 0);
    this.view.setStatus('Oynanıyor');
    this.audio.unlock();
  }

  handleEvent(event) {
    if (event.type === 'drop') {
      this.view.showNext(this.simulation.sequence, event.dropped);
      this.view.updateRound(event, this.payout, this.currentCost);
      if (event.dropped === event.totalDrops) this.view.setStatus('Son birleşmeler');
    }
    if (event.type === 'merge') {
      const nextPayout = payoutForMode(event.score, this.currentCost, this.selectedCount);
      const difference = nextPayout - this.payout;
      this.payout = nextPayout;
      this.wallet.updatePayout(nextPayout);
      this.view.updateRound(event, nextPayout, this.currentCost);
      this.view.flashPayout();
      this.renderer.burst(event, difference ? `+${formatTokens(difference)}` : '5×');
      this.audio.playMerge(event.level);
    }
    if (event.type === 'overflow') this.view.setStatus('Sepet doldu');
    if (event.type === 'finish') this.finish(event);
  }

  finish(event) {
    const result = this.wallet.settle({ reason: event.endReason, merges: event.merges });
    this.view.setBusy(false);
    this.refreshSelection();
    this.view.updateWallet(this.wallet);
    this.view.showNext([], 0, true);
    this.view.showResult(result);
    this.audio.finish();
  }

  setPaused(paused) {
    if (!this.busy) return;
    this.paused = paused;
    this.accumulator = 0;
    this.view.setPaused(paused);
    if (!paused) this.audio.unlock();
  }

  update(deltaMs) {
    if (!this.paused && this.busy) {
      this.accumulator += Math.min(deltaMs, 100) * this.speed;
      // Fixed simulation steps keep gameplay consistent at 30/60/120 Hz and 1×/2×.
      let steps = 0;
      while (this.accumulator >= GAME.stepMs && steps < 12 && this.busy) {
        this.simulation.step();
        this.accumulator -= GAME.stepMs;
        steps++;
      }
    }
    this.renderer.sync(this.simulation.fruits, this.paused ? 0 : deltaMs);
  }

  destroy() {
    this.abortController.abort();
    this.renderer.app.ticker.remove(this.tick);
    this.simulation.destroy();
    this.renderer.destroy();
    this.audio.destroy();
    this.view.destroy();
  }
}
