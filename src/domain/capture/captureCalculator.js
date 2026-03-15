import { clamp } from '../../utils/math';

export function calculateCaptureChance({ targetPokemon, ballBonus = 1 }) {
  const hpRatio = targetPokemon.currentHp / targetPokemon.stats.hp;
  const baseChance = (targetPokemon.captureRate || 45) / 255;
  const lowHpBonus = (1 - hpRatio) * 0.45;
  const levelPenalty = Math.max(0, (targetPokemon.level - 5) * 0.01);

  return clamp(baseChance + lowHpBonus + (ballBonus - 1) * 0.2 - levelPenalty, 0.05, 0.95);
}
