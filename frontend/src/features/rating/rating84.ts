const vibeMap: Record<number, number> = { 1: 1, 2: 1.0556, 3: 1.1111, 4: 1.1667, 5: 1.2222, 6: 1.2788, 7: 1.3333, 8: 1.3889, 9: 1.4444, 10: 1.5 };

export function calculateRating84(architecture: number, characters: number, lang_style: number, idea: number, vibe: number) {
  const objectiveScore = (architecture + characters + lang_style + idea) * 1.4;
  const multiplier = vibeMap[vibe] ?? 1;
  const finalScore = Math.min(84, Math.round(objectiveScore * multiplier));
  return { objectiveScore: Number(objectiveScore.toFixed(2)), multiplier, finalScore };
}
