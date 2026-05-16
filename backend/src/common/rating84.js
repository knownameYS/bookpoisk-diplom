export const vibeMultiplier = [
  1.0,
  1.0556,
  1.1111,
  1.1667,
  1.2222,
  1.2788,
  1.3333,
  1.3889,
  1.4444,
  1.5
];

export function calculateRating84({ architecture, characters, language, idea, vibe }) {
  const objectiveScore = (architecture + characters + language + idea) * 1.4;
  const multiplier = vibeMultiplier[vibe - 1];
  const finalScore = Math.min(84, Math.round(objectiveScore * multiplier));

  return {
    objectiveScore: Number(objectiveScore.toFixed(2)),
    multiplier,
    finalScore
  };
}

export function ratingLabel(score) {
  if (score >= 75) return 'Шедевр и обязательное чтение';
  if (score >= 60) return 'Сильная и запоминающаяся книга';
  if (score >= 45) return 'Хорошая книга, но не без минусов';
  if (score >= 30) return 'Средний уровень';
  return 'Слабая реализация идеи';
}
