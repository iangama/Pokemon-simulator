import { calculateDamage } from '../domain/battle/damageCalculator';
import { getTypeMultiplier } from '../domain/battle/typeEffectiveness';

export function selectBestMove(attacker, defender) {
  if (!attacker?.moves?.length) return null;
  let best = attacker.moves.find((move) => (move.currentPp ?? 0) > 0) || null;
  let bestDamage = -1;

  for (const move of attacker.moves) {
    if ((move.currentPp || 0) <= 0) continue;
    const estimate = calculateDamage({ attacker, defender, move }).amount;
    if (estimate > bestDamage) {
      bestDamage = estimate;
      best = move;
    }
  }

  return best;
}

export function shouldAiSwitch(team, activeIndex, opponent) {
  const active = team[activeIndex];
  if (!active || active.fainted) return -1;
  const hpRatio = active.currentHp / Math.max(1, active.stats.hp);
  if (hpRatio > 0.3) return -1;

  let bestIdx = -1;
  let bestScore = -1;
  for (let i = 0; i < team.length; i += 1) {
    if (i === activeIndex) continue;
    const candidate = team[i];
    if (!candidate || candidate.fainted || candidate.currentHp <= 0) continue;
    const defenseScore = 1 / Math.max(0.1, getTypeMultiplier(opponent.types?.[0] || 'normal', candidate.types || []));
    const hpScore = candidate.currentHp / Math.max(1, candidate.stats.hp);
    const score = defenseScore + hpScore;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}
