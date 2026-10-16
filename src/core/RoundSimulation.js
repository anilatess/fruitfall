import Matter from 'matter-js';
import { FRUITS, GAME } from '../config/game.js';
import { Random } from './random.js';

const { Engine, Bodies, Body, Composite, Events } = Matter;

/** Headless physics and rules. No rendering, DOM, storage, or real-time timers. */
export class RoundSimulation {
  constructor({ onEvent = () => {} } = {}) {
    this.onEvent = onEvent;
    this.engine = Engine.create({ gravity: { x: 0, y: GAME.gravity }, enableSleeping: true });
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 6;
    this.fruits = new Map();
    this.pendingPairs = [];
    this.collisionListener = ({ pairs }) => this.pendingPairs.push(...pairs);
    Events.on(this.engine, 'collisionStart collisionActive', this.collisionListener);
    this.reset();
  }

  reset() {
    Composite.clear(this.engine.world, false);
    Engine.clear(this.engine);
    this.fruits.clear();
    this.pendingPairs.length = 0;
    this.time = 0;
    this.score = 0;
    this.merges = 0;
    this.dropped = 0;
    this.totalDrops = 0;
    this.bestLevel = 0;
    this.lastMergeTime = -Infinity;
    this.state = 'idle';
    this.endReason = 'complete';
    this.sequence = [];
    const wall = { isStatic: true, friction: 0.55, restitution: 0.08, label: 'basket' };
    Composite.add(this.engine.world, [
      Bodies.rectangle(GAME.left - 15, 330, 30, 720, wall),
      Bodies.rectangle(GAME.right + 15, 330, 30, 720, wall),
      Bodies.rectangle(280, GAME.floor + 20, GAME.right - GAME.left + 60, 40, wall),
    ]);
  }

  start({ count, seed }) {
    this.reset();
    this.totalDrops = count;
    const random = new Random(seed);
    this.sequence = Array.from({ length: count }, () => {
      const level = random.fruitLevel();
      const radius = FRUITS[level].radius;
      return {
        level,
        x: random.between(GAME.left + radius + 5, GAME.right - radius - 5),
        spin: random.between(-0.025, 0.025),
        angle: random.between(-0.35, 0.35),
      };
    });
    this.state = 'dropping';
    this.nextDropAt = 350;
    this.emit('start');
  }

  addFruit(level, x, y, options = {}) {
    const spec = FRUITS[level];
    const body = Bodies.circle(
      x,
      y,
      spec.radius,
      {
        restitution: 0.16,
        friction: 0.44,
        frictionStatic: 0.65,
        frictionAir: 0.003,
        density: 0.0014,
        sleepThreshold: 70,
        angle: options.angle ?? 0,
        label: `fruit:${level}`,
      },
      36,
    );
    body.plugin.fruitLevel = level;
    const fruit = {
      body,
      level,
      bornAt: this.time,
      mergeAfter: this.time + 100,
      overflowSince: null,
    };
    this.fruits.set(body.id, fruit);
    Composite.add(this.engine.world, body);
    Body.setAngularVelocity(body, options.spin ?? 0);
    if (options.velocity) Body.setVelocity(body, options.velocity);
    this.emit('spawn', { fruit, merged: options.merged ?? false });
    return fruit;
  }

  seedDisplay() {
    this.reset();
    this.addFruit(5, 225, 454, { angle: -0.18 });
    this.addFruit(3, 416, 514, { angle: 0.25 });
    this.addFruit(4, 378, 348, { angle: -0.2 });
    this.addFruit(2, 113, 292, { angle: 0.1 });
    this.addFruit(1, 273, 281, { angle: -0.22 });
    this.addFruit(0, 181, 255, { angle: 0.17 });
    // Settle display fruits without triggering rewards or merging them.
    for (let step = 0; step < 180; step++) Engine.update(this.engine, GAME.stepMs);
    this.pendingPairs.length = 0;
  }

  step() {
    if (!['dropping', 'settling'].includes(this.state)) return;
    this.time += GAME.stepMs;
    if (this.state === 'dropping' && this.time >= this.nextDropAt) this.dropNext();
    Engine.update(this.engine, GAME.stepMs);
    this.resolveMerges();
    this.checkOverflow();
    if (this.state === 'settling') this.checkFinished();
  }

  dropNext() {
    const next = this.sequence[this.dropped];
    this.addFruit(next.level, next.x, GAME.spawnY, next);
    this.dropped++;
    this.nextDropAt += GAME.dropIntervalMs;
    this.emit('drop', { level: next.level });
    if (this.dropped === this.totalDrops) this.beginSettling('complete');
  }

  resolveMerges() {
    const claimed = new Set();
    for (const pair of this.pendingPairs) {
      const first = this.fruits.get(pair.bodyA.id);
      const second = this.fruits.get(pair.bodyB.id);
      if (!first || !second || first.level !== second.level) continue;
      if (claimed.has(first.body.id) || claimed.has(second.body.id)) continue;
      if (this.time < first.mergeAfter || this.time < second.mergeAfter) continue;
      claimed.add(first.body.id);
      claimed.add(second.body.id);
      this.merge(first, second);
    }
    this.pendingPairs.length = 0;
  }

  merge(first, second) {
    const level = first.level + 1;
    const radius = FRUITS[Math.min(level, FRUITS.length - 1)].radius;
    const x = Math.max(
      GAME.left + radius,
      Math.min(GAME.right - radius, (first.body.position.x + second.body.position.x) / 2),
    );
    const y = Math.min(GAME.floor - radius, (first.body.position.y + second.body.position.y) / 2);
    const velocity = {
      x: (first.body.velocity.x + second.body.velocity.x) * 0.25,
      y: Math.min(0, (first.body.velocity.y + second.body.velocity.y) * 0.2) - 0.35,
    };
    this.removeFruit(first);
    this.removeFruit(second);
    const weight = level === FRUITS.length ? GAME.finalMergeWeight : FRUITS[level].weight;
    this.score += weight;
    this.merges++;
    this.lastMergeTime = this.time;
    this.bestLevel = Math.max(this.bestLevel, Math.min(level, FRUITS.length - 1));
    if (level < FRUITS.length) this.addFruit(level, x, y, { velocity, merged: true });
    this.emit('merge', { x, y, level: Math.min(level, 5), weight, cleared: level === 6 });
  }

  removeFruit(fruit) {
    this.fruits.delete(fruit.body.id);
    Composite.remove(this.engine.world, fruit.body);
    this.emit('remove', { id: fruit.body.id });
  }

  checkOverflow() {
    if (this.state !== 'dropping') return;
    for (const fruit of this.fruits.values()) {
      const oldEnough = this.time - fruit.bornAt > GAME.overflowGraceMs;
      const aboveLine = fruit.body.position.y - FRUITS[fruit.level].radius < GAME.danger;
      if (oldEnough && aboveLine && fruit.body.speed < 1.5) {
        fruit.overflowSince ??= this.time;
        if (this.time - fruit.overflowSince > GAME.overflowHoldMs) {
          this.beginSettling('full');
          this.emit('overflow');
          break;
        }
      } else fruit.overflowSince = null;
    }
  }

  beginSettling(reason) {
    this.state = 'settling';
    this.settlingAt = this.time;
    this.endReason = reason;
  }

  checkFinished() {
    const elapsed = this.time - this.settlingAt;
    const calm = [...this.fruits.values()].every(({ body }) => body.speed < 0.22);
    const noRecentMerge = this.time - this.lastMergeTime > 700;
    if ((elapsed >= GAME.settleMinMs && calm && noRecentMerge) || elapsed > GAME.settleMaxMs) {
      this.state = 'finished';
      this.emit('finish');
    }
  }

  snapshot() {
    return {
      state: this.state,
      score: this.score,
      merges: this.merges,
      dropped: this.dropped,
      totalDrops: this.totalDrops,
      bestLevel: this.bestLevel,
      endReason: this.endReason,
    };
  }

  emit(type, data = {}) {
    this.onEvent({ type, ...data, ...this.snapshot() });
  }

  destroy() {
    Events.off(this.engine, 'collisionStart collisionActive', this.collisionListener);
    Composite.clear(this.engine.world, false);
    Engine.clear(this.engine);
    this.fruits.clear();
  }
}
