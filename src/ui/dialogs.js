import { FRUITS } from '../config/game.js';
import { icon } from './icons.js';

export function renderDialogs() {
  return /* HTML */ `
    <dialog id="rules-dialog" class="modal">
      <div class="modal-heading">
        <h2>Nasıl oynanır?</h2>
        <button class="icon-button" data-close aria-label="Kapat">${icon('close')}</button>
      </div>
      <div class="modal-content">
        <p>
          10, 15 veya 20 meyve seçip Oyna’ya bas. Meyveler otomatik düşer. İki aynı meyve birleşir;
          her birleşme ödül ekler.
        </p>
        <div class="fruit-chain">
          ${FRUITS.map(({ name }, level) => `${level ? '<span>›</span>' : ''}<span class="fruit-art fruit-art-${level}" role="img" aria-label="${name}"></span>`).join('')}
        </div>
        <ul>
          <li>Mod ücreti = meyve sayısı × meyve başına jeton. Ücret tur başında düşülür.</li>
          <li>
            Kiraz %50, çilek %30, üzüm %20 olasılıkla gelir. Daha büyük meyveler birleşerek oluşur.
          </li>
          <li>
            Her birleşmenin kendi ödülü vardır. Ek zincir çarpanı yoktur. İki karpuz birleşince ödül
            verip kaybolur.
          </li>
          <li>Sepet dolarsa tur erken biter. O ana kadar biriken ödülün bakiyene eklenir.</li>
          <li>
            Ödül üst sınırı mod ücretinin 5 katıdır. Seçili modda en fazla
            <strong><span id="cap">75,00</span> jeton</strong> ödenebilir.
          </li>
          <li>Giriş ücreti ayrıca geri verilmez. Net sonuç = toplam ödül − mod ücreti.</li>
        </ul>
        <details>
          <summary>Birleşme ödülleri</summary>
          <p>
            Seçili modun ücretine göre hesaplanır. Ödüller birikmiş toplam üzerinden en yakın jeton
            kuruşuna yuvarlanır.
          </p>
          <div id="reward-table" class="reward-table"></div>
        </details>
        <details>
          <summary>RTP ve tur bilgileri</summary>
          <p>
            %96 bir tasarım hedefidir; kesin veya sertifikalı RTP değildir. Çok sayıda turdaki
            toplam ödülün toplam ücrete oranını anlatır. Kazanma ihtimali veya tek tur garantisi
            değildir.
          </p>
          <p>
            Bakiye ve geçmiş sonuçlar meyve olasılıklarını değiştirmez. Hız düğmesi yalnızca oynatma
            hızını değiştirir. Sayfa yenilenirse kaydedilmiş birikmiş ödül bir kez bakiyene eklenir.
          </p>
        </details>
        <p class="demo-info">
          Jetonların parasal değeri yoktur. Para yatırma ve çekme bulunmaz. Kayıtlar bu tarayıcıda
          tutulur.
        </p>
        <button id="add-tokens" class="secondary-button">
          ${icon('plus')} 1.000 sanal jeton ekle
        </button>
      </div>
    </dialog>
    <dialog id="stats-dialog" class="modal">
      <div class="modal-heading">
        <h2>Geçmiş</h2>
        <button class="icon-button" data-close aria-label="Kapat">${icon('close')}</button>
      </div>
      <div class="modal-content">
        <div class="history-heading">
          <h3>Son turlar</h3>
          <span id="history-count">0 tur</span>
        </div>
        <div id="history-list" class="history-list">
          <p class="history-empty">Henüz tamamlanan bir tur yok.</p>
        </div>
        <details>
          <summary>İstatistikler</summary>
          <div id="stats-content" class="stats-grid"></div>
          <p class="muted small">
            Son 100 tamamlanmış turu kapsar. Gerçekleşen geri dönüş teorik RTP’yi kanıtlamaz.
          </p>
        </details>
        <div class="current-round">
          <span>Bu tur: <strong id="merge-count">0</strong> birleşme</span
          ><span>Ödül / ücret: <strong id="multiplier">0,00×</strong></span>
        </div>
      </div>
    </dialog>
  `;
}
