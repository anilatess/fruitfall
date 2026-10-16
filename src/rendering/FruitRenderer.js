import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import { FRUITS, GAME } from '../config/game.js';

// Artwork pivots sit at the flesh of each fruit, excluding stems and leaves.
const ART = [
  { x: 0.5, y: 0.625, diameter: 0.66 },
  { x: 0.5, y: 0.59, diameter: 0.67 },
  { x: 0.5, y: 0.56, diameter: 0.73 },
  { x: 0.5, y: 0.46, diameter: 0.84 },
  { x: 0.5, y: 0.46, diameter: 0.77 },
  { x: 0.5, y: 0.46, diameter: 0.84 },
];

function makeShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,.42)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return Texture.from(canvas);
}

export class FruitRenderer {
  constructor(host) {
    this.host = host;
    this.app = new Application();
    this.views = new Map();
    this.effects = [];
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.visualTime = 0;
  }

  async init() {
    await this.app.init({
      width: GAME.width,
      height: GAME.height,
      backgroundAlpha: 0,
      antialias: true,
      preference: 'webgl',
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    this.app.ticker.maxFPS = 60;
    this.app.ticker.minFPS = 20;
    // autoDensity sets pixel dimensions inline; let the responsive host size the canvas.
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';
    this.host.append(this.app.canvas);
    const atlas = await Assets.load(`${import.meta.env.BASE_URL}assets/fruits.png`);
    const cellWidth = atlas.width / 3;
    const cellHeight = atlas.height / 2;
    this.textures = FRUITS.map(
      (_, index) =>
        new Texture({
          source: atlas.source,
          frame: new Rectangle(
            (index % 3) * cellWidth,
            Math.floor(index / 3) * cellHeight,
            cellWidth,
            cellHeight,
          ),
        }),
    );
    this.shadowTexture = makeShadowTexture();
    this.drawBasket();
    this.shadowLayer = new Container();
    this.fruitLayer = new Container();
    this.effectLayer = new Container();
    this.app.stage.addChild(this.shadowLayer, this.fruitLayer, this.effectLayer);
    this.drawGlassReflections();
  }

  drawBasket() {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = GAME.width;
    glowCanvas.height = GAME.height;
    const context = glowCanvas.getContext('2d');
    const glow = context.createRadialGradient(270, 440, 20, 270, 420, 330);
    glow.addColorStop(0, '#64734427');
    glow.addColorStop(0.65, '#3d573218');
    glow.addColorStop(1, '#2f472500');
    context.fillStyle = glow;
    context.fillRect(0, 0, GAME.width, GAME.height);
    this.app.stage.addChild(new Sprite(Texture.from(glowCanvas)));

    const glass = new Graphics();
    glass
      .moveTo(GAME.left, GAME.rim)
      .lineTo(GAME.left, GAME.floor - 34)
      .quadraticCurveTo(GAME.left, GAME.floor, GAME.left + 34, GAME.floor)
      .lineTo(GAME.right - 34, GAME.floor)
      .quadraticCurveTo(GAME.right, GAME.floor, GAME.right, GAME.floor - 34)
      .lineTo(GAME.right, GAME.rim)
      .stroke({ color: 0xa6bea5, alpha: 0.23, width: 2.4 });
    glass
      .roundRect(GAME.left + 3, GAME.rim, GAME.right - GAME.left - 6, GAME.floor - GAME.rim - 2, 28)
      .fill({ color: 0xd4e7c4, alpha: 0.018 });
    glass
      .roundRect(GAME.left - 9, GAME.rim - 5, GAME.right - GAME.left + 18, 9, 4)
      .fill({ color: 0xaec1a1, alpha: 0.1 })
      .stroke({ color: 0xb7c6ac, alpha: 0.14, width: 1 });
    glass
      .moveTo(GAME.left + 6, GAME.rim + 15)
      .lineTo(GAME.left + 6, GAME.floor - 38)
      .stroke({ color: 0xcce3c6, alpha: 0.05, width: 7 });
    glass
      .moveTo(GAME.right - 5, GAME.rim + 16)
      .lineTo(GAME.right - 5, GAME.floor - 39)
      .stroke({ color: 0xcce3c6, alpha: 0.07, width: 4 });
    this.app.stage.addChild(glass);

    this.dangerLine = new Graphics();
    for (let x = GAME.left + 16; x < GAME.right - 12; x += 12) {
      this.dangerLine.moveTo(x, GAME.danger).lineTo(x + 4, GAME.danger);
    }
    this.dangerLine.stroke({ color: 0xb2a975, alpha: 0.24, width: 1 });
    this.app.stage.addChild(this.dangerLine);
    const limit = new Text({
      text: 'SEPET SINIRI',
      style: { fontFamily: 'Arial', fontSize: 7, letterSpacing: 1.2, fill: 0x7c8d71 },
    });
    limit.anchor.set(1, 0.5);
    limit.position.set(GAME.right - 15, GAME.danger - 13);
    this.app.stage.addChild(limit);

    const base = new Graphics();
    base
      .roundRect(GAME.left - 15, GAME.floor + 9, GAME.right - GAME.left + 30, 17, 6)
      .fill({ color: 0x756043, alpha: 0.42 });
    base
      .roundRect(GAME.left - 18, GAME.floor + 7, GAME.right - GAME.left + 36, 6, 3)
      .fill({ color: 0xa68e62, alpha: 0.55 });
    base
      .moveTo(GAME.left - 8, GAME.floor + 8)
      .lineTo(GAME.right + 8, GAME.floor + 8)
      .stroke({ color: 0xd5ba7f, alpha: 0.34, width: 1 });
    base
      .roundRect(GAME.left - 8, GAME.floor + 27, GAME.right - GAME.left + 16, 3, 1)
      .fill({ color: 0x000000, alpha: 0.2 });
    this.app.stage.addChild(base);
    const label = new Text({
      text: 'KÜÇÜK BAŞLANGIÇLAR, BÜYÜK BİRLEŞMELER',
      style: {
        fontFamily: 'Arial',
        fontSize: 7,
        letterSpacing: 1.6,
        fill: 0x60745a,
      },
    });
    label.anchor.set(0.5);
    label.position.set(280, GAME.floor + 48);
    this.app.stage.addChild(label);
  }

  drawGlassReflections() {
    const reflections = new Graphics();
    reflections
      .moveTo(GAME.left + 12, GAME.rim + 58)
      .lineTo(GAME.left + 12, GAME.rim + 148)
      .stroke({ color: 0xe4f6d5, alpha: 0.045, width: 7 });
    reflections
      .moveTo(GAME.left + 12, GAME.rim + 165)
      .lineTo(GAME.left + 12, GAME.rim + 190)
      .stroke({ color: 0xe4f6d5, alpha: 0.045, width: 7 });
    this.app.stage.addChild(reflections);
  }

  addView(fruit, animated) {
    const { level, body } = fruit;
    const spec = FRUITS[level];
    const art = ART[level];
    const sprite = new Sprite(this.textures[level]);
    sprite.anchor.set(art.x, art.y);
    const diameter = (spec.radius * 2) / art.diameter;
    sprite.width = sprite.height = diameter;
    const holder = new Container();
    holder.addChild(sprite);
    const shadow = new Sprite(this.shadowTexture);
    shadow.anchor.set(0.5);
    shadow.width = spec.radius * 2.5;
    shadow.height = spec.radius * 0.6;
    shadow.alpha = 0.65;
    this.shadowLayer.addChild(shadow);
    this.fruitLayer.addChild(holder);
    const view = { holder, shadow, scale: animated && !this.reducedMotion ? 0.7 : 1 };
    this.views.set(body.id, view);
    return view;
  }

  sync(fruits, deltaMs) {
    this.visualTime += deltaMs;
    for (const [id, view] of this.views) {
      if (!fruits.has(id)) {
        view.holder.destroy({ children: true });
        view.shadow.destroy();
        this.views.delete(id);
      }
    }
    for (const [id, fruit] of fruits) {
      const view = this.views.get(id) ?? this.addView(fruit, true);
      view.scale += (1 - view.scale) * Math.min(1, deltaMs / 75);
      view.holder.scale.set(view.scale);
      view.holder.position.set(fruit.body.position.x, fruit.body.position.y);
      view.holder.rotation = fruit.body.angle;
      view.shadow.position.set(
        fruit.body.position.x + 6,
        fruit.body.position.y + FRUITS[fruit.level].radius * 0.87,
      );
    }
    this.updateEffects(deltaMs);
  }

  burst({ x, y, level, cleared }, rewardLabel) {
    if (this.reducedMotion) return;
    const ring = new Graphics()
      .circle(0, 0, FRUITS[level].radius * 0.65)
      .stroke({ color: cleared ? 0xe5d68c : FRUITS[level].color, alpha: 0.7, width: 1.5 });
    ring.position.set(x, y);
    this.addEffect(ring, 450, (node, progress) => {
      node.scale.set(0.7 + progress * 0.8);
      node.alpha = (1 - progress) * 0.6;
    });
    for (let index = 0; index < 8; index++) {
      const angle = (index / 8) * Math.PI * 2;
      const radius = FRUITS[level].radius * 0.7;
      const dot = new Graphics()
        .circle(0, 0, index % 2 ? 1.5 : 2.4)
        .fill(index % 2 ? 0xe3e8bd : FRUITS[level].color);
      this.addEffect(dot, 600, (node, progress) => {
        const distance = radius * (0.5 + progress * 1.3);
        node.position.set(
          x + Math.cos(angle) * distance,
          y + Math.sin(angle) * distance + progress ** 2 * 20,
        );
        node.alpha = 1 - progress;
      });
    }
    if (rewardLabel) {
      const label = new Text({
        text: rewardLabel,
        style: {
          fontFamily: 'Arial',
          fontSize: cleared ? 19 : 15,
          fontWeight: '600',
          fill: 0xe8f3ce,
          stroke: { color: 0x233b23, width: 3 },
        },
      });
      label.anchor.set(0.5);
      this.addEffect(label, 1150, (node, progress) => {
        node.position.set(x, y - 20 - progress * 46);
        node.alpha = Math.min(1, (1 - progress) * 3);
      });
    }
  }

  addEffect(node, duration, update) {
    this.effectLayer.addChild(node);
    this.effects.push({ node, duration, elapsed: 0, update });
  }

  updateEffects(deltaMs) {
    this.effects = this.effects.filter((effect) => {
      effect.elapsed += deltaMs;
      const progress = Math.min(1, effect.elapsed / effect.duration);
      effect.update(effect.node, progress);
      if (progress < 1) return true;
      effect.node.destroy();
      return false;
    });
  }

  clearEffects() {
    this.effects.forEach(({ node }) => node.destroy());
    this.effects = [];
  }

  destroy() {
    this.clearEffects();
    this.app.destroy(true, { children: true });
  }
}
