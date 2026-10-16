# Fruitfall

JavaScript, PixiJS 8 ve Matter.js ile yapılmış, gerçekçi meyve dokuları kullanan otomatik meyve birleştirme oyunu. Arayüz Türkçedir. Sunucu, üyelik veya gerçek para bağlantısı gerektirmez.

## Çalıştırma

Node.js 22.12 veya üzeri gerekir. Bu klasörde:

```sh
npm ci
npm run dev
```

Terminalde görünen yerel bağlantıyı aç. Hazır yayını denemek için:

```sh
npm run build
npm run preview
```

`dist/index.html` dosyasını çift tıklamak yerine bir HTTP sunucusu kullan. Modüller ve dokular bunun üzerinden yüklenir.

## Oyunun kuralları

- 10, 15 ve 20 meyvelik modlar vardır. Başlangıçta meyve başına 1 sanal jetonla sırasıyla 10, 15 ve 20 jetona alınırlar. Birim tutar 1 / 2 / 5 / 10 olarak seçilebilir.
- Tur ücreti başta düşülür. Aynı anda yalnızca bir tur çalışır.
- Meyveler 850 ms aralıklarla, sepetin genişliği boyunca rastgele noktalardan otomatik bırakılır.
- Kiraz %50, çilek %30, üzüm %20 olasılıkla gelir.
- Birleşme yolu: kiraz → çilek → üzüm → portakal → elma → karpuz.
- Her birleşme ödül ekler. Ayrı zincir çarpanı yoktur. İki karpuz birleşince ödül verir ve kaldırılır.
- Son meyveden sonra fizik ve zincirler tamamlanır. Yeni düşen meyveler doluluk değerlendirmesine hemen alınmaz; kısa bir bekleme uygulanır.
- Sepet erken dolarsa kalan düşüşler iptal edilir, son birleşmeler beklenir ve birikmiş ödül korunur.
- Turun toplam ödemesi mod ücretinin en fazla 5 katıdır. Bu bir üst sınırdır; her modda veya turda bu tutara ulaşılacağı anlamına gelmez.
- Giriş bedeli ayrıca iade edilmez. Örneğin 10 jetonluk turda 12 jeton ödül, 2 jeton net kazançtır.
- Tüm bakiye hareketleri tam sayı jeton kuruşlarıyla hesaplanır. Tek tek ara ödüller yerine birikmiş toplam yuvarlanır; böylece yuvarlama birikmez.
- Yenileme sonrasında yarım kalan turun kaydedilmiş ödülü bir kez ödenir. Turun kullanılmamış düşüşleri için ücret iadesi yapılmaz.
- Bakiye ve son 100 tur bu tarayıcının yerel kaydında tutulur. Tarayıcı kaydını silmek bunları sıfırlar.
- Jetonlar ücretsizdir ve parasal değer taşımaz. Oyun bilgilerinden 1.000 jeton eklenebilir.

## Mimari

| Konum                            | Sorumluluk                                                       |
| -------------------------------- | ---------------------------------------------------------------- |
| `src/config/game.js`             | Meyveler, fizik sınırları, modlar, süreler ve ödül katsayıları   |
| `src/core/RoundSimulation.js`    | Ekransız çalışabilen sabit adımlı fizik ve tur kuralları         |
| `src/core/random.js`             | Tura özel tohumdan meyve türü, düşüş yeri ve dönüş üretimi       |
| `src/core/rewards.js`            | Ödül ve 5× üst sınır hesabı; sayı biçimlendirme                  |
| `src/rendering/FruitRenderer.js` | Pixi sahnesi, dokular, cam sepet, gölgeler ve birleşme efektleri |
| `src/game/GameController.js`     | Fizik, görüntü, bakiye ve arayüz arasındaki akış                 |
| `src/services/Wallet.js`         | Tur ücreti, ödül, yerel kayıt ve kesilen turdan kurtarma         |
| `src/services/AudioService.js`   | İsteğe bağlı sentezlenmiş sesler                                 |
| `src/ui/`                        | Arayüz, erişilebilir kontroller ve uyumlu ekran düzeni           |
| `tests/`                         | Birleşme yarışları, ödeme, doluluk ve kayıt testleri             |
| `scripts/calibrate.js`           | Üç mod için ayrı örnekleme ve RTP katsayısı tahmini              |

Fizik DOM, Pixi veya yerel depolamayı bilmez. Görüntü motoru para hesabı yapmaz. Olasılıklar bakiye veya geçmiş kazanımlara göre değiştirilmez. Her tur başlamadan bütün meyve dizisi üretilir. 1× / 2× gösterim hızı aynı sabit fizik adımlarını farklı hızda gösterir. Sekme gizlenirse veya kurallar açılırsa tur duraklar; oyuncu devam ettirir.

## RTP'nin durumu

**%96 bir tasarım hedefidir; kesin veya sertifikalı RTP iddiası değildir.** Üç modun ayrı katsayıları vardır. Fazladan düşüşler, birleşmeler ve 5× üst sınır birlikte hesaba katılır.

Her birleşmenin bir ağırlığı vardır: çilek 1, üzüm 2, portakal 4, elma 8, karpuz 16, son karpuz çifti 32. Turun ham skoru bunların toplamıdır.

```text
toplam ödül = min(yuvarla(ham skor × mod katsayısı × mod ücreti), 5 × mod ücreti)
```

Yeni bir deneme raporu üretmek için:

```sh
npm run calibrate -- 10000
```

Her mod için 10.000 kalibrasyon turu ve farklı tohumlarla 10.000 doğrulama turu çalışır. Sonuç `calibration-report.json` dosyasına yazılır. `coefficient` değerleri `src/config/game.js` içindeki ilgili modlara aktarılmalıdır. Güven aralıkları örneklem hatasını gösterir; kalibrasyon tahmininin belirsizliğini, cihazlar arası kayan nokta farklarını veya bağımsız sertifikasyonu kapsamaz. Fizik, düşüş aralığı, olasılıklar, meyve boyutu veya ödüller değişirse yeniden hesap yapılmalıdır.

Yerel bakiyeyi kullanıcı değiştirebilir. Bu mimari ücretsiz sanal oyun içindir. Tarayıcıdaki bakiye ve rastgelelik herhangi bir gerçek para veya değer taşıyan ödül sistemi için güvenilir otorite değildir.

Teslimde toplam 60.000 tur çalıştırıldı: her mod için 10.000 kalibrasyon ve 10.000 ayrı doğrulama turu. Doğrulama sonuçları aşağıdadır; bunlar teorik RTP garantisi değildir.

| Mod      | Doğrulamada geri dönüş | Yaklaşık %95 güven aralığı |
| -------- | ---------------------- | -------------------------- |
| 10 meyve | %95,05                 | %94,27–%95,84              |
| 15 meyve | %95,81                 | %95,17–%96,45              |
| 20 meyve | %95,88                 | %95,26–%96,50              |

Tam örnekleme kaydı `calibration-report.json` dosyasındadır. Mod katsayıları bu raporla eşleştirilmiştir.

## Kontroller ve doğrulama

```sh
npm test
npm run build
npm run format:check
```

- Ses başlangıçta kapalıdır; oyuncunun etkileşimiyle açılır.
- Duraklatma düğmesi veya oyun dışındaki bir öğe odakta değilken boşluk tuşu kullanılır.
- Hareket azaltma tercihi varsa parçacık ve ödül animasyonları azaltılır.
- Küçük ekranlarda oyun, mod seçimi ve hasat panelleri alt alta yerleşir.

## GitHub Pages'te yayınlama

1. Bu klasörün içeriğini bir GitHub reposunun köküne koy. `node_modules` yüklenmez. `.github/workflows/pages.yml` dahil edilmelidir.
2. Reponun **Settings → Pages → Build and deployment → Source** alanında **GitHub Actions** seç.
3. `main` dalına gönder. Hazır workflow testleri çalıştırır, derler ve `dist` klasörünü Pages'e yayınlar.
4. Reponun ana dalı başka isimdeyse workflow içindeki `branches` değerini değiştir.

`vite.config.js` içindeki `base: './'` nedeniyle uygulama `kullanici.github.io/repo-adi/` altında da varlıklarını bulur. İstersen yalnızca `dist` içeriğini başka bir statik barındırmaya da koyabilirsin. Gizli anahtar veya sunucu ayarı gerekmez.

Yayın akışının referansı: [GitHub Pages resmî workflow belgeleri](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Görseller

Gerçekçi altı meyve tek bir saydam sprite atlasındadır: `public/assets/fruits.png`. Üretim kaydı ve kullanılan prompt [ASSETS.md](ASSETS.md) dosyasındadır. Arayüzdeki çizgisel simgeler projede çizilmiştir. DM Sans çevrimiçi yüklenir; yüklenemezse sistem yazı tipi kullanılır.
