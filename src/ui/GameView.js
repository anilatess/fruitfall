import { FRUITS, GAME, getMode } from '../config/game.js';
import { calculatePayout, formatTokens } from '../core/rewards.js';
import { fruitIcon, renderTemplate } from './template.js';
import { icon } from './icons.js';

export class GameView {
  constructor(root) {
    root.innerHTML = renderTemplate();
    this.root = root;
    this.elements = Object.fromEntries(
      [...root.querySelectorAll('[id]')].map((element) => [element.id, element]),
    );
    this.abortController = new AbortController();
    this.toastTimer = null;
    this.bindDialogs();
  }

  on(id, type, listener) {
    this.elements[id].addEventListener(type, listener, { signal: this.abortController.signal });
  }

  bindDialogs() {
    this.root.querySelectorAll('[data-dialog]').forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          this.onDialogOpen?.();
          this.elements[button.dataset.dialog].showModal();
        },
        { signal: this.abortController.signal },
      );
    });
    this.root.querySelectorAll('dialog').forEach((dialog) => {
      dialog
        .querySelector('[data-close]')
        .addEventListener('click', () => dialog.close(), { signal: this.abortController.signal });
      dialog.addEventListener(
        'click',
        (event) => {
          const bounds = dialog.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            dialog.close();
        },
        { signal: this.abortController.signal },
      );
    });
  }

  bindModes(listener) {
    this.root.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => listener(Number(button.dataset.mode)), {
        signal: this.abortController.signal,
      });
    });
  }

  ready() {
    this.elements['loading-state'].hidden = true;
    this.elements['start-button'].disabled = false;
    this.elements['start-label'].textContent = 'Hasadı başlat';
    this.elements['mobile-start-button'].disabled = false;
    this.elements['mobile-start-label'].textContent = 'Hasadı başlat';
  }

  setSelection(count, unit, busy) {
    const cost = count * unit * 100;
    this.root.querySelectorAll('[data-mode]').forEach((button) => {
      button.classList.toggle('selected', Number(button.dataset.mode) === count);
      button.setAttribute('aria-pressed', String(Number(button.dataset.mode) === count));
      button.disabled = busy;
    });
    this.elements.stake.textContent = unit;
    this.elements.cost.textContent = formatTokens(cost);
    this.elements.cap.textContent = formatTokens(cost * GAME.payoutCap);
    this.elements['drop-total'].textContent = count;
    this.elements['mobile-mode'].textContent = `${count} meyve`;
    this.elements['mobile-cost'].textContent = formatTokens(cost);
    this.elements['stake-down'].disabled = busy || unit === 1;
    this.elements['stake-up'].disabled = busy || unit === 10;
    const mode = getMode(count);
    const rewards = FRUITS.slice(1).map((fruit, index) => ({
      name: fruit.name,
      level: index + 1,
      weight: fruit.weight,
    }));
    rewards.push({ name: 'İki karpuz', level: 5, weight: GAME.finalMergeWeight });
    this.elements['reward-table'].innerHTML = rewards
      .map(
        ({ name, level, weight }) => `
      <div class="reward-row">${fruitIcon(level)}<span>${name}</span><strong>${formatTokens(calculatePayout(weight, cost, mode.coefficient))} jeton</strong></div>
    `,
      )
      .join('');
  }

  setBusy(busy) {
    this.elements['start-button'].disabled = busy;
    this.elements['start-label'].textContent = busy ? 'Hasat devam ediyor…' : 'Hasadı başlat';
    this.elements['pause-button'].disabled = !busy;
    this.elements['mobile-start-button'].disabled = busy;
    this.elements['mobile-start-label'].textContent = busy ? 'Hasat sürüyor…' : 'Hasadı başlat';
    this.elements['mobile-mode-hint'].textContent = busy ? 'Sepete dön ↑' : 'Modu değiştir ↑';
    this.elements['mobile-mode-button'].setAttribute(
      'aria-label',
      busy ? 'Sepete git' : 'Mod seçimine git',
    );
    if (busy) {
      this.elements['idle-hint'].hidden = true;
      this.elements['round-result'].hidden = true;
    }
  }

  updateRound({ dropped, totalDrops, merges }, payout, cost) {
    const formatted = formatTokens(payout);
    this.elements['mobile-payout'].textContent = formatted;
    const [whole, decimal] = formatted.split(',');
    this.elements.payout.innerHTML = `${whole}<span>,${decimal}</span>`;
    this.elements['drop-count'].textContent = dropped;
    this.elements['drop-total'].textContent = totalDrops;
    this.elements['merge-count'].textContent = merges;
    this.elements.multiplier.textContent = `${(payout / cost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
    this.elements['round-progress-fill'].style.width = `${(dropped / totalDrops) * 100 || 0}%`;
    this.elements['reward-meter-fill'].style.width =
      `${(payout / (cost * GAME.payoutCap)) * 100 || 0}%`;
  }

  showNext(sequence, dropped, finished = false) {
    const next = sequence.slice(dropped, dropped + 3);
    this.elements['next-label'].textContent = next.length
      ? 'SIRADAKİ MEYVELER'
      : finished
        ? 'HASAT TAMAMLANDI'
        : 'SON BİRLEŞMELER';
    this.elements['next-fruits'].innerHTML = next.map(({ level }) => fruitIcon(level)).join('');
  }

  setStatus(text, dot = true) {
    this.elements['round-status'].replaceChildren();
    if (dot) this.elements['round-status'].append(document.createElement('i'));
    this.elements['round-status'].append(document.createTextNode(text));
  }

  flashPayout() {
    this.elements.payout.classList.remove('pulse');
    requestAnimationFrame(() => this.elements.payout.classList.add('pulse'));
  }

  setPaused(paused) {
    this.elements['pause-overlay'].hidden = !paused;
    this.elements['pause-button'].innerHTML = icon(paused ? 'play' : 'pause');
    this.elements['pause-button'].setAttribute(
      'aria-label',
      paused ? 'Tura devam et' : 'Turu duraklat',
    );
  }

  setSound(enabled) {
    this.elements['sound-button'].innerHTML = icon(enabled ? 'sound' : 'muted');
    this.elements['sound-button'].setAttribute('aria-label', enabled ? 'Sesi kapat' : 'Sesi aç');
    this.elements['sound-button'].setAttribute('aria-pressed', String(enabled));
  }

  showResult(result) {
    this.elements['result-title'].textContent =
      result.reason === 'full' ? 'SEPET DOLDU · HASADIN KORUNDU' : 'HASAT TAMAMLANDI';
    this.elements['result-payout'].textContent = formatTokens(result.payout);
    const net = result.payout - result.cost;
    this.elements['result-net'].textContent =
      `Net sonuç: ${net > 0 ? '+' : ''}${formatTokens(net)} jeton`;
    this.elements['result-net'].classList.toggle('positive', net > 0);
    this.elements['round-result'].hidden = false;
    this.setStatus(
      result.reason === 'full'
        ? 'Sepet doldu, ödül bakiyene eklendi'
        : 'Hasat tamamlandı, ödül bakiyene eklendi',
    );
  }

  updateWallet(wallet) {
    this.elements.balance.textContent = formatTokens(wallet.balance);
    const history = wallet.history;
    this.elements['history-count'].textContent = `${history.length} tur`;
    if (history.length) {
      this.elements['history-list'].innerHTML = history
        .slice(0, 5)
        .map((round) => {
          const time = new Date(round.finishedAt).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Istanbul',
          });
          return `<div class="history-row"><span class="history-symbol">${icon('leaf')}</span><div class="history-copy"><strong>${round.count} meyvelik hasat</strong><span>${time} · ${round.reason === 'interrupted' ? 'Yarım kalan tur' : `${round.merges} birleşme`}</span></div><div class="history-amount">${formatTokens(round.payout)}<small>${(round.payout / round.cost).toFixed(2).replace('.', ',')}×</small></div></div>`;
        })
        .join('');
    }
    const cost = history.reduce((sum, round) => sum + round.cost, 0);
    const payout = history.reduce((sum, round) => sum + round.payout, 0);
    const values = [
      ['Tamamlanan tur', history.length],
      ['Toplam mod ücreti', `${formatTokens(cost)} <small>jeton</small>`],
      ['Toplam ödül', `${formatTokens(payout)} <small>jeton</small>`],
      [
        'Gerçekleşen geri dönüş',
        cost ? `%${((payout / cost) * 100).toFixed(2).replace('.', ',')}` : '—',
      ],
      ['Kârlı tur', history.filter((round) => round.payout > round.cost).length],
      [
        'En yüksek ödül',
        `${formatTokens(Math.max(0, ...history.map((round) => round.payout)))} <small>jeton</small>`,
      ],
    ];
    this.elements['stats-content'].innerHTML = values
      .map(
        ([label, value]) =>
          `<div class="stat-box"><span>${label}</span><strong>${value}</strong></div>`,
      )
      .join('');
  }

  toast(text) {
    clearTimeout(this.toastTimer);
    this.elements.toast.textContent = text;
    this.elements.toast.hidden = false;
    this.toastTimer = setTimeout(() => {
      this.elements.toast.hidden = true;
    }, 4500);
  }

  showError() {
    const loading = this.elements['loading-state'];
    loading.replaceChildren();
    const message = document.createElement('span');
    message.textContent = 'Bahçe yüklenemedi. Sayfayı yeniden açmayı dene.';
    const retry = document.createElement('button');
    retry.className = 'error-retry';
    retry.textContent = 'Yeniden dene';
    retry.addEventListener('click', () => location.reload());
    loading.append(message, retry);
    loading.hidden = false;
  }

  destroy() {
    this.abortController.abort();
    clearTimeout(this.toastTimer);
  }
}
