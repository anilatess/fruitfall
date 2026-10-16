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

// Crop presentation margins without changing physics coordinates or outcomes.
const VIEW = Object.freeze({ width: 460, height: 530, offsetX: -50, offsetY: -90 });

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
      width: VIEW.width,
      height: VIEW.height,
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
    this.scene = new Container();
    this.scene.position.set(VIEW.offsetX, VIEW.offsetY);
    this.app.stage.addChild(this.scene);
    this.drawBasket();
    this.shadowLayer = new Container();
    this.fruitLayer = new Container();
    this.effectLayer = new Container();
    this.scene.addChild(this.shadowLayer, this.fruitLayer, this.effectLayer);
    this.drawGlassReflections();
  }

  drawBasket() {
    const glass = new Graphics();
    glass
      .moveTo(GAME.left, GAME.rim)
      .lineTo(GAME.left, GAME.floor - 30)
      .quadraticCurveTo(GAME.left, GAME.floor, GAME.left + 30, GAME.floor)
      .lineTo(GAME.right - 30, GAME.floor)
      .quadraticCurveTo(GAME.right, GAME.floor, GAME.right, GAME.floor - 30)
      .lineTo(GAME.right, GAME.rim)
      .stroke({ color: 0x5b6062, alpha: 0.7, width: 2 });
    glass
      .roundRect(GAME.left + 3, GAME.rim, GAME.right - GAME.left - 6, GAME.floor - GAME.rim - 2, 25)
      .fill({ color: 0xffffff, alpha: 0.13 });
    glass
      .roundRect(GAME.left - 5, GAME.rim - 3, GAME.right - GAME.left + 10, 5, 2)
      .fill({ color: 0x626668, alpha: 0.8 });
    this.scene.addChild(glass);

    this.dangerLine = new Graphics();
    for (let x = GAME.left + 12; x < GAME.right - 10; x += 11) {
      this.dangerLine.moveTo(x, GAME.danger).lineTo(x + 4, GAME.danger);
    }
    this.dangerLine.stroke({ color: 0x73736a, alpha: 0.27, width: 1 });
    this.scene.addChild(this.dangerLine);

    const base = new Graphics();
    base
      .roundRect(GAME.left - 7, GAME.floor + 7, GAME.right - GAME.left + 14, 9, 3)
      .fill({ color: 0x434749, alpha: 0.85 });
    this.scene.addChild(base);
  }

  drawGlassReflections() {
    const reflection = new Graphics();
    reflection
      .moveTo(GAME.left + 5, GAME.rim + 20)
      .lineTo(GAME.left + 5, GAME.floor - 40)
      .stroke({ color: 0xffffff, alpha: 0.6, width: 2 });
    this.scene.addChild(reflection);
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
          fill: 0x25272a,
          stroke: { color: 0xf7f5ec, width: 3 },
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
