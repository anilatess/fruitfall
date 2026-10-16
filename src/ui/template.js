import { FRUITS, MODES } from '../config/game.js';
import { icon } from './icons.js';
import { renderDialogs } from './dialogs.js';

export function fruitIcon(level) {
  return /* HTML */ `<span
    class="fruit-art fruit-art-${level}"
    role="img"
    aria-label="${FRUITS[level].name}"
  ></span>`;
}

export function renderTemplate() {
  return /* HTML */ `
    <header class="site-header">
      <a class="brand" href="./" aria-label="Fruitfall ana sayfa"
        ><span class="brand-mark">f</span>fruitfall</a
      >
      <div class="header-tools">
        <div class="wallet">
          <span>Bakiye</span><strong id="balance">1.000,00</strong><small>jeton</small>
        </div>
        <button
          class="icon-button"
          data-dialog="stats-dialog"
          aria-label="Geçmiş ve istatistikler"
          title="Geçmiş"
        >
          ${icon('chart')}
        </button>
        <button
          class="icon-button help-button"
          data-dialog="rules-dialog"
          aria-label="Nasıl oynanır?"
          title="Nasıl oynanır?"
        >
          ?
        </button>
      </div>
    </header>

    <main class="game-shell">
      <section class="game-stage" aria-label="Meyve oyunu">
        <div class="stage-toolbar">
          <div class="reward-readout">
            <span>Toplam ödül</span><strong id="payout">0<span>,00</span></strong>
          </div>
          <div class="next-fruits">
            <span id="next-label">Sıradaki</span>
            <div id="next-fruits">${fruitIcon(0)}</div>
          </div>
          <div class="stage-actions">
            <button
              id="speed-button"
              class="icon-button speed-button"
              aria-label="Oyun hızını değiştir"
              title="Oyun hızı"
            >
              1×
            </button>
            <button
              id="pause-button"
              class="icon-button"
              aria-label="Turu duraklat"
              title="Duraklat"
              disabled
            >
              ${icon('pause')}
            </button>
            <button
              id="sound-button"
              class="icon-button"
              aria-label="Sesi aç"
              title="Ses"
              aria-pressed="false"
            >
              ${icon('muted')}
            </button>
          </div>
        </div>

        <div class="board-wrap">
          <div
            id="game-canvas"
            role="img"
            aria-label="Meyvelerin düşüp birleştiği oyun alanı"
          ></div>
          <div id="idle-hint" class="idle-hint">Aynı meyveler birleşir.</div>
          <div id="round-result" class="round-result" hidden aria-live="polite">
            <span id="result-title">Tur bitti</span>
            <strong id="result-payout">0,00</strong><small>jeton</small>
            <p id="result-net"></p>
          </div>
          <div id="pause-overlay" class="pause-overlay" hidden>
            <div>
              <strong>Duraklatıldı</strong
              ><button id="resume-button" class="secondary-button">${icon('play')} Devam et</button>
            </div>
          </div>
          <div id="loading-state" class="loading-state">
            <span class="spinner" aria-hidden="true"></span><span>Yükleniyor</span>
          </div>
        </div>

        <div class="round-line">
          <span id="round-status">Hazır</span
          ><span><strong id="drop-count">0</strong> / <span id="drop-total">15</span> meyve</span>
        </div>

        <div class="control-bar">
          <div class="mode-control">
            <span class="control-label">Meyve sayısı</span>
            <div class="mode-switch" role="group" aria-label="Meyve sayısı">
              ${MODES.map(({ count }) => /* HTML */ `<button data-mode="${count}" aria-pressed="${count === 15}" class="${count === 15 ? 'selected' : ''}">${count}</button>`).join('')}
            </div>
          </div>
          <div class="stake-section">
            <span class="control-label">Jeton / meyve</span>
            <div class="stake-control">
              <button id="stake-down" class="icon-button" aria-label="Jetonu azalt">
                ${icon('minus')}</button
              ><output id="stake">1</output
              ><button id="stake-up" class="icon-button" aria-label="Jetonu artır">
                ${icon('plus')}
              </button>
            </div>
          </div>
          <button id="start-button" class="primary-button" disabled>
            <span id="start-label">Yükleniyor</span
            ><span class="button-cost"><span id="cost">15,00</span> <small>jeton</small></span>
          </button>
        </div>
      </section>
      <div class="game-footnote"><span>Sanal jeton</span><span>Ödül sınırı 5×</span></div>
    </main>

    ${renderDialogs()}
    <div id="toast" class="toast" role="status" hidden></div>
  `;
}
