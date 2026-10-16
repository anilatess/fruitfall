import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { RoundSimulation } from '../src/core/RoundSimulation.js';
import { Random } from '../src/core/random.js';
import { calculatePayout } from '../src/core/rewards.js';
import { Wallet } from '../src/services/Wallet.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('three touching identical fruits cannot pay for the same fruit twice', () => {
  const simulation = new RoundSimulation();
  simulation.state = 'settling';
  simulation.settlingAt = 0;
  [210, 245, 280].forEach((x) => {
    const fruit = simulation.addFruit(0, x, 400);
    fruit.mergeAfter = 0;
  });
  simulation.step();
  assert.equal(simulation.merges, 1);
  assert.equal(simulation.score, 1);
  assert.equal(simulation.fruits.size, 2);
  simulation.destroy();
});

test('two watermelons clear and award one final merge', () => {
  const simulation = new RoundSimulation();
  simulation.state = 'settling';
  simulation.settlingAt = 0;
  [220, 350].forEach((x) => {
    const fruit = simulation.addFruit(5, x, 400);
    fruit.mergeAfter = 0;
  });
  simulation.step();
  assert.equal(simulation.score, 32);
  assert.equal(simulation.merges, 1);
  assert.equal(simulation.fruits.size, 0);
  simulation.destroy();
});

test('overflow ends early and preserves score already earned', () => {
  const simulation = new RoundSimulation();
  simulation.state = 'dropping';
  simulation.totalDrops = 20;
  simulation.dropped = 5;
  simulation.nextDropAt = Infinity;
  simulation.score = 12;
  simulation.time = 2000;
  const fruit = simulation.addFruit(4, 250, 200);
  fruit.bornAt = 0;
  Matter.Body.setStatic(fruit.body, true);
  for (let step = 0; step < 250 && simulation.state !== 'finished'; step++) simulation.step();
  assert.equal(simulation.state, 'finished');
  assert.equal(simulation.endReason, 'full');
  assert.equal(simulation.dropped, 5);
  assert.equal(simulation.score, 12);
  simulation.destroy();
});

test('a round always terminates and consumes at most its purchased drops', () => {
  const simulation = new RoundSimulation();
  for (const count of [10, 15, 20]) {
    for (let seed = 1; seed < 6; seed++) {
      simulation.start({ count, seed });
      for (let step = 0; step < 2400 && simulation.state !== 'finished'; step++) simulation.step();
      assert.equal(simulation.state, 'finished');
      assert.ok(simulation.dropped <= count);
      assert.ok(simulation.score >= 0);
    }
  }
  simulation.destroy();
});

test('fruit schedule does not depend on time, balance, or previous rounds', () => {
  const simulation = new RoundSimulation();
  simulation.start({ count: 20, seed: 54321 });
  const sequence = structuredClone(simulation.sequence);
  simulation.start({ count: 10, seed: 99 });
  simulation.start({ count: 20, seed: 54321 });
  assert.deepEqual(simulation.sequence, sequence);
  simulation.destroy();
});

test('spawn distribution follows the declared 50/30/20 weights', () => {
  const random = new Random(4);
  const counts = [0, 0, 0];
  for (let index = 0; index < 100_000; index++) counts[random.fruitLevel()]++;
  [0.5, 0.3, 0.2].forEach((expected, level) =>
    assert.ok(Math.abs(counts[level] / 100_000 - expected) < 0.006),
  );
});

test('rewards use integer cents and never exceed the total 5× cap', () => {
  assert.equal(calculatePayout(1, 1500, 0.045), 68);
  assert.equal(calculatePayout(10000, 1500, 0.045), 7500);
  assert.throws(() => calculatePayout(-1, 100, 0.1), RangeError);
});

test('wallet prevents overlapping purchases, insufficient funds and double settlement', () => {
  const wallet = new Wallet(memoryStorage());
  assert.throws(() => wallet.reserve({ id: 'expensive', cost: 100001, count: 20, seed: 1 }));
  wallet.reserve({ id: 'one', cost: 1500, count: 15, seed: 1 });
  assert.throws(() => wallet.reserve({ id: 'two', cost: 1500, count: 15, seed: 1 }));
  wallet.updatePayout(900);
  assert.throws(() => wallet.updatePayout(800));
  assert.throws(() => wallet.updatePayout(7501));
  wallet.settle({ reason: 'complete', merges: 6 });
  assert.equal(wallet.balance, 99400);
  assert.equal(wallet.history.length, 1);
  assert.equal(wallet.settle({ reason: 'complete', merges: 6 }), null);
  assert.equal(wallet.balance, 99400);
});

test('a reload pays the saved accrued reward exactly once', () => {
  const storage = memoryStorage();
  const first = new Wallet(storage);
  first.reserve({ id: 'interrupted', cost: 1000, count: 10, seed: 42 });
  first.updatePayout(1750);
  const second = new Wallet(storage);
  assert.equal(second.recovered, true);
  assert.equal(second.balance, 100750);
  assert.equal(second.history[0].reason, 'interrupted');
  const third = new Wallet(storage);
  assert.equal(third.recovered, false);
  assert.equal(third.balance, 100750);
});
