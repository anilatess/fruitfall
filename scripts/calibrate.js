import { writeFile } from 'node:fs/promises';
import { RoundSimulation } from '../src/core/RoundSimulation.js';
import { GAME } from '../src/config/game.js';

const samples = Number(process.argv[2] ?? 1500);
const counts = [10, 15, 20];
const simulations = new RoundSimulation();

function sample(count, amount, seedBase) {
  return Array.from({ length: amount }, (_, index) => {
    simulations.start({ count, seed: (seedBase + index * 2654435761) >>> 0 });
    for (let step = 0; simulations.state !== 'finished' && step < 2400; step++) simulations.step();
    if (simulations.state !== 'finished') throw new Error('Simulation did not terminate.');
    return simulations.score;
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  target: GAME.targetRtp,
  samplesPerMode: samples,
  modes: [],
};
for (const count of counts) {
  const train = sample(count, samples, 1000 + count);
  let low = 0,
    high = 1;
  for (let iteration = 0; iteration < 60; iteration++) {
    const middle = (low + high) / 2;
    const rtp = train.reduce((sum, score) => sum + Math.min(score * middle, 5), 0) / samples;
    if (rtp < GAME.targetRtp) low = middle;
    else high = middle;
  }
  const coefficient = (low + high) / 2;
  const holdout = sample(count, samples, 9_000_000 + count);
  const cost = count * 100;
  const returns = holdout.map(
    (score) => Math.min(Math.round(score * coefficient * cost), cost * 5) / cost,
  );
  const mean = returns.reduce((sum, value) => sum + value, 0) / samples;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (samples - 1);
  const margin = 1.96 * Math.sqrt(variance / samples);
  const mode = {
    count,
    coefficient,
    holdoutRtp: mean,
    approximate95Interval: [mean - margin, mean + margin],
    profitRate: returns.filter((value) => value > 1).length / samples,
    capRate: returns.filter((value) => value === 5).length / samples,
    meanScore: holdout.reduce((sum, value) => sum + value, 0) / samples,
  };
  report.modes.push(mode);
  console.log(JSON.stringify(mode));
}
simulations.destroy();
await writeFile('calibration-report.json', JSON.stringify(report, null, 2) + '\n');
