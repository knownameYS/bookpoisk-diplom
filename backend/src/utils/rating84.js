const vibeMap = {
  1: 1.0,
  2: 1.0556,
  3: 1.1111,
  4: 1.1667,
  5: 1.2222,
  6: 1.2788,
  7: 1.3333,
  8: 1.3889,
  9: 1.4444,
  10: 1.5
};

export function calculateRating84({ architecture, characters, lang_style, idea, vibe }) {
  const objectiveScore = (architecture + characters + lang_style + idea) * 1.4;
  const multiplier = vibeMap[vibe];
  const finalScore = Math.min(84, Math.round(objectiveScore * multiplier));

  return {
    architecture,
    characters,
    lang_style,
    idea,
    vibe,
    objectiveScore: Number(objectiveScore.toFixed(2)),
    multiplier,
    finalScore
  };
}

export function ratingInterpretation(score) {
  if (score >= 75) return 'Шедевр и обязательное чтение';
  if (score >= 60) return 'Сильная и запоминающаяся книга';
  if (score >= 45) return 'Хорошая книга, но не без минусов';
  if (score >= 30) return 'Средний уровень';
  return 'Слабая реализация идеи';
}

export { vibeMap };
