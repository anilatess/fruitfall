# Görsel kaydı

- Dosya: `public/assets/fruits.png`
- Araç: Yerleşik `image_gen.imagegen`; CLI veya harici API anahtarı kullanılmadı.
- Biçim: 1536 × 1024 RGBA, 3 sütun × 2 satır, saydam arka plan.
- Sıra: Kiraz, çilek, üzüm / portakal, elma, karpuz.
- Görsel, üretim konumundan proje içine kopyalandı. Oyun bu yerel kopyayı kullanır.
- Pixi texture frame'leri atlası çalışma anında böler; kaynak görsele sonradan müdahale edilmedi.

## Kullanılan son prompt

```text
Create ONE production game sprite atlas on a genuinely transparent background. Rectangular 3 columns x 2 rows evenly spaced grid, six equally sized square cells. Each cell contains exactly ONE isolated whole fruit, centered, fully visible, occupying 76 percent of its cell, no touching across cells. Top row left to right: a single round deep crimson cherry with a short curved stem; one plump red strawberry with subtle seeds and small green crown; one compact round bunch of purple grapes. Bottom row left to right: one round orange with realistically dimpled peel and one tiny green leaf; one round red apple with realistic skin and short stem; one whole ROUND dark-green striped watermelon. Consistent almost frontal view, slightly above; consistent soft upper-left studio illumination, rich natural colors, realistic textures, dimensional rounded volumes, appetizing photorealistic premium fruit product photography for a polished physics browser game. No faces, no cartoon outlines, no lettering, no labels, no borders, no background, no floor, no cast shadows outside the silhouettes, transparent alpha. Keep fruit silhouettes broadly circular and centered to work with circular physics colliders. Three columns and TWO rows, no additional objects. All fruits same approximate visual diameter in their own cells.
```
