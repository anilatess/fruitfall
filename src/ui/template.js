import { FRUITS, MODES } from '../config/game.js';
import { icon } from './icons.js';

export function fruitIcon(level, extra = '') {
  return /* HTML */ `<span
    class="fruit-art fruit-art-${level} ${extra}"
    role="img"
    aria-label="${FRUITS[level].name}"
  ></span>`;
}

export function renderTemplate() {
  return /* HTML */ `
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <header class="site-header">
      <a class="brand" href="./" aria-label="Fruitfall ana sayfa"
        ><span class="brand-mark">${icon('leaf')}</span
        ><span>fruitfall<span class="brand-dot">.</span></span></a
      >
      <nav class="header-nav" aria-label="Ana menü">
        <span class="nav-active">Oyna</span
        ><button data-dialog="rules-dialog">Nasıl oynanır?</button
        ><button data-dialog="stats-dialog">İstatistikler</button>
      </nav>
      <div class="header-right">
        <span class="demo-badge"><i></i>Sanal oyun</span>
        <div class="wallet">
          ${icon('coin')}<span id="balance">1.000,00</span><span class="wallet-unit">jeton</span>
        </div>
      </div>
    </header>

    <main class="main-shell">
      <div class="page-heading">
        <div>
          <div class="eyebrow">BİRLEŞMENİN DOĞASI</div>
          <h1>Her meyve, yeni bir ihtimal.</h1>
        </div>
        <div class="live-label"><i></i>Bahçe seni bekliyor</div>
      </div>
      <div class="game-layout">
        <aside class="setup-panel panel">
          <div class="section-heading">
            <span class="step-number">01</span>
            <h2>Bahçeni seç</h2>
          </div>
          <p class="muted small panel-description">Bir mod seç. Gerisini meyvelere bırak.</p>
          <div class="mode-list" role="group" aria-label="Meyve modu">
            ${MODES.map((mode, index) => `<button class="mode-card ${index === 1 ? 'selected' : ''}" data-mode="${mode.count}" aria-pressed="${index === 1}"><span class="mode-illustration leaves-${index}">${icon('sprout')}</span><span class="mode-copy"><strong>${mode.name}</strong><span>${mode.count} meyve <b>·</b> ${mode.description}</span></span><span class="radio-dot"></span></button>`).join('')}
          </div>
          <div class="stake-section">
            <div class="input-label">
              <label>MEYVE BAŞINA JETON</label
              ><span title="Mod ücreti, meyve sayısı × bu tutardır.">${icon('info')}</span>
            </div>
            <div class="stake-control">
              <button id="stake-down" class="icon-button" aria-label="Jetonu azalt">
                ${icon('minus')}</button
              ><output id="stake">1</output><span class="stake-unit">jeton</span
              ><button id="stake-up" class="icon-button" aria-label="Jetonu artır">
                ${icon('plus')}
              </button>
            </div>
          </div>
          <div class="cost-summary">
            <div>
              <span>Mod ücreti</span
              ><strong><span id="cost">15,00</span> <small>jeton</small></strong>
            </div>
            <div>
              <span>Ödül üst sınırı</span
              ><span
                ><span id="cap">75,00</span> <small>jeton</small> <b class="times-chip">5×</b></span
              >
            </div>
          </div>
          <button id="start-button" class="primary-button" disabled>
            <span id="start-label">Bahçe hazırlanıyor…</span>${icon('arrow')}
          </button>
          <div class="start-note">${icon('check')}Birleşen her meyve ödül getirir.</div>
          <div class="setup-divider"></div>
          <div class="section-heading compact">
            <span class="step-number">02</span>
            <h2>Birleşme yolu</h2>
          </div>
          <div class="fruit-chain">
            ${FRUITS.map((fruit, level) => `${level ? '<span class="chain-arrow">›</span>' : ''}${fruitIcon(level)}`).join('')}
          </div>
          <p class="chain-note">
            İki aynı meyve, bir büyük meyve.<br />İki karpuz birleşir, sepette yer açılır.
          </p>
          <button class="text-button rules-link" data-dialog="rules-dialog">
            Ödülleri ve kuralları incele ${icon('arrow')}
          </button>
        </aside>

        <section class="game-stage panel" aria-label="Meyve sepeti">
          <div class="stage-toolbar">
            <span class="stage-title">${icon('leaf')} MEYVE BAHÇESİ</span>
            <span class="stage-mobile-reward"
              ><span id="mobile-payout">0,00</span><small>jeton</small></span
            >
            <div class="stage-actions">
              <button
                id="speed-button"
                class="speed-button"
                aria-label="Oyun hızını değiştir"
                title="Görsel oynatma hızı"
              >
                1×</button
              ><button id="pause-button" class="icon-button" aria-label="Turu duraklat" disabled>
                ${icon('pause')}</button
              ><button
                id="sound-button"
                class="icon-button"
                aria-label="Sesi aç"
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
              aria-label="Meyvelerin düşüp birleştiği fizik tabanlı oyun alanı"
            ></div>
            <div class="next-fruits">
              <span id="next-label">BAHÇEDEN SEPETE</span>
              <div id="next-fruits">${fruitIcon(0)}${fruitIcon(1)}${fruitIcon(2)}</div>
            </div>
            <div class="idle-hint" id="idle-hint">
              <span class="hint-line"></span
              ><span>Bir bahçe seç.<br /><strong>Hasadın başlasın.</strong></span>
            </div>
            <div id="pause-overlay" class="pause-overlay" hidden>
              <div>
                ${icon('pause')}<strong>Bir nefes arası.</strong
                ><span>Hazır olduğunda kaldığın yerden devam et.</span
                ><button id="resume-button" class="secondary-button">
                  Devam et ${icon('play')}
                </button>
              </div>
            </div>
            <div id="round-result" class="round-result" hidden aria-live="polite">
              <div class="result-eyebrow" id="result-title">HASAT TAMAMLANDI</div>
              <div class="result-value">
                <span id="result-payout">0,00</span><small>jeton</small>
              </div>
              <div id="result-net" class="result-net"></div>
              <button id="result-again" class="text-button">Yeni bir hasat ${icon('arrow')}</button>
            </div>
            <div class="loading-state" id="loading-state">
              <span class="loading-leaf">${icon('leaf')}</span><span>Bahçe hazırlanıyor</span>
            </div>
          </div>
          <div class="stage-footer">
            <span id="round-status"><i></i>Yeni bir tur için hazır</span
            ><span class="round-progress-label"
              ><strong id="drop-count">0</strong><span>/</span
              ><span id="drop-total">15</span> meyve</span
            >
          </div>
          <div class="round-progress"><span id="round-progress-fill"></span></div>
        </section>

        <aside class="harvest-panel">
          <section class="reward-panel panel">
            <div class="reward-heading">
              <span class="eyebrow">BU TURUN HASADI</span><span class="small-tag">Sanal jeton</span>
            </div>
            <div class="payout-number" id="payout">0<span>,00</span></div>
            <div class="payout-caption">biriken toplam ödül</div>
            <div class="reward-meter"><span id="reward-meter-fill"></span></div>
            <div class="meter-labels"><span>0×</span><span>Üst sınır 5×</span></div>
            <div class="round-metrics">
              <div><span>Birleşme</span><strong id="merge-count">0</strong></div>
              <div><span>Ödül / ücret</span><strong id="multiplier">0,00×</strong></div>
            </div>
            <div class="reward-footnote">Sepet dolsa da biriken ödülün senin.</div>
          </section>
          <section class="history-panel panel">
            <div class="history-heading">
              <h2>Son hasatlar</h2>
              <span id="history-count">0 tur</span>
            </div>
            <div id="history-list" class="history-list">
              <div class="history-empty">
                ${icon('sprout')}<span>Her hasat bir hikâye.<br />İlkini sen başlat.</span>
              </div>
            </div>
          </section>
          <div class="garden-note">
            ${icon('leaf')}
            <p>Küçük bir kirazla başlar.<br />Bir karpuza kadar uzanır.</p>
          </div>
        </aside>
      </div>
      <footer class="site-footer">
        <span>fruitfall <b>·</b> Sanal jetonlarla bir meyve molası.</span
        ><button data-dialog="rules-dialog">Oyun bilgileri ${icon('info')}</button>
      </footer>
    </main>

    <dialog id="rules-dialog" class="modal">
      <div class="modal-heading">
        <div>
          <div class="eyebrow">BAHÇENİN KURALLARI</div>
          <h2>Birleş, büyü, biriktir.</h2>
        </div>
        <button class="icon-button" data-close aria-label="Kapat">${icon('close')}</button>
      </div>
      <div class="modal-content">
        <p>
          10, 15 veya 20 meyvelik bir mod seç. Meyve başına jeton tutarıyla meyve sayısı çarpılır ve
          mod ücreti tur başında bakiyenden düşülür.
        </p>
        <ol>
          <li>
            Meyveler rastgele noktalardan otomatik düşer. Kiraz %50, çilek %30, üzüm %20 olasılıkla
            gelir.
          </li>
          <li>
            İki aynı meyve temas ettiğinde bir büyük meyve oluşur. Her birleşme ödül ekler. Zincirin
            her adımı ayrı sayılır; ek zincir çarpanı yoktur.
          </li>
          <li>İki karpuz birleştiğinde son bir ödül verir ve kaybolur. Sepette yer açılır.</li>
          <li>
            Son meyveden sonra hareketler ve birleşmeler tamamlanır. Sepet dolarsa tur erken biter.
            Birikmiş ödül bakiyene eklenir.
          </li>
          <li>
            Toplam ödül, mod ücretinin en fazla 5 katıdır. Ödül toplamına giriş ücretinin ayrıca
            iadesi dahil değildir; net sonuç ödül eksi mod ücretidir.
          </li>
        </ol>
        <h3>Birleşme ödülleri</h3>
        <p>
          Ödüller seçilen modun ücretine göre hesaplanır. Aşağıdaki değerler şu an seçili mod
          içindir.
        </p>
        <div id="reward-table" class="reward-table"></div>
        <p class="small muted">
          Turun birikmiş ödülü en yakın jeton kuruşuna yuvarlanır. Ödül üst sınırına yaklaşınca son
          birleşme yalnızca kalan tutarı ekler.
        </p>
        <h3>RTP ve test sürümü</h3>
        <p>
          Üç modun tasarım hedefi %96 RTP’dir. Bu, çok sayıda turdaki toplam ödülün toplam mod
          ücretine oranıdır; kazanma ihtimali veya tek tur garantisi değildir. Katsayılar örnek
          turlarla kalibre edilir. Bu sürümün %96 RTP’si sertifikalı veya kesin olarak doğrulanmış
          değildir.
        </p>
        <p>
          Hız ve duraklatma sadece gösterimi etkiler. Bakiye, önceki kazançlar veya kayıplar meyve
          olasılıklarını değiştirmez. Bir turun ortasında sayfayı yenilersen, kaydedilmiş birikmiş
          ödülün bakiyene eklenir.
        </p>
        <div class="demo-info">
          Bu oyunda jetonların parasal değeri yoktur. Satın alma, para yatırma veya çekme bulunmaz.
          Kayıtlar bu tarayıcıda tutulur.
        </div>
        <button id="add-tokens" class="secondary-button">
          ${icon('plus')} 1.000 sanal jeton ekle
        </button>
      </div>
    </dialog>
    <dialog id="stats-dialog" class="modal">
      <div class="modal-heading">
        <div>
          <div class="eyebrow">HASAT DEFTERİN</div>
          <h2>Bahçenden sayılar.</h2>
        </div>
        <button class="icon-button" data-close aria-label="Kapat">${icon('close')}</button>
      </div>
      <div class="modal-content">
        <div id="stats-content" class="stats-grid"></div>
        <p class="muted small">
          Bu değerler yalnızca bu tarayıcıdaki son 100 tamamlanmış turu kapsar. Gerçekleşen geri
          dönüş, oyunun uzun vadeli teorik RTP’sini kanıtlamaz.
        </p>
      </div>
    </dialog>
    <div class="mobile-round-bar">
      <button id="mobile-mode-button" class="mobile-mode-button" aria-label="Mod seçimine git">
        <strong
          ><span id="mobile-mode">15 meyve</span><b>·</b><span id="mobile-cost">15,00</span>
          <small>jeton</small></strong
        ><span id="mobile-mode-hint">Modu değiştir ↑</span></button
      ><button
        id="mobile-start-button"
        class="primary-button"
        aria-label="Seçili modu başlat"
        disabled
      >
        <span id="mobile-start-label">Hazırlanıyor…</span>${icon('arrow')}
      </button>
    </div>
    <div id="toast" class="toast" role="status" hidden></div>
  `;
}
