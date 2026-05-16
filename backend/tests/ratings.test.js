import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRating84, vibeMultiplier } from '../src/common/rating84.js';

test('rating84 uses the exact mandatory formula', () => {
  const result = calculateRating84({
    architecture: 8,
    characters: 9,
    language: 7,
    idea: 10,
    vibe: 6
  });

  const objectiveScore = (8 + 9 + 7 + 10) * 1.4;
  const expected = Math.min(84, Math.round(objectiveScore * vibeMultiplier[5]));

  assert.equal(result.objectiveScore, Number(objectiveScore.toFixed(2)));
  assert.equal(result.multiplier, 1.2788);
  assert.equal(result.finalScore, expected);
});

test('rating84 caps final score at 84', () => {
  const result = calculateRating84({
    architecture: 10,
    characters: 10,
    language: 10,
    idea: 10,
    vibe: 10
  });

  assert.equal(result.finalScore, 84);
});
