import { toTitle } from '../../utils/formatters';

function pickLevelUpMoves(moves = [], cap = 4) {
  const candidates = moves
    .map((m) => {
      const levelUp = (m.version_group_details || []).find((v) => v.move_learn_method?.name === 'level-up');
      return {
        name: m.move?.name,
        url: m.move?.url,
        levelLearnedAt: levelUp?.level_learned_at ?? null,
      };
    })
    .filter((m) => m.name)
    .sort((a, b) => (a.levelLearnedAt ?? 999) - (b.levelLearnedAt ?? 999));

  const unique = [];
  const seen = new Set();
  for (const move of candidates) {
    if (!seen.has(move.name)) {
      seen.add(move.name);
      unique.push(move);
    }
  }

  return unique.slice(0, cap).map((m) => ({
    id: m.name,
    name: toTitle(m.name),
    slug: m.name,
    power: 40,
    type: 'normal',
    accuracy: 100,
    damageClass: 'physical',
    pp: 35,
    currentPp: 35,
  }));
}

export function buildInitialMoveSet(pokemonData) {
  const selected = pickLevelUpMoves(pokemonData.moves || [], 4);
  if (selected.length === 0) {
    return [
      { id: 'tackle', name: 'Tackle', slug: 'tackle', power: 40, type: 'normal', accuracy: 100, damageClass: 'physical', pp: 35, currentPp: 35 },
      { id: 'quick-attack', name: 'Quick Attack', slug: 'quick-attack', power: 40, type: 'normal', accuracy: 100, damageClass: 'physical', pp: 30, currentPp: 30 },
    ];
  }
  return selected;
}

export function enrichMovesWithDetails(moves, moveDetailsBySlug = {}) {
  return moves.map((move) => {
    const detail = moveDetailsBySlug[move.slug];
    if (!detail) return move;
    return {
      ...move,
      power: detail.power || move.power,
      type: detail.type?.name || move.type,
      accuracy: detail.accuracy || move.accuracy,
      damageClass: detail.damage_class?.name || move.damageClass,
      pp: detail.pp || move.pp,
      currentPp: Math.min(move.currentPp ?? detail.pp ?? 10, detail.pp || move.pp),
    };
  });
}
