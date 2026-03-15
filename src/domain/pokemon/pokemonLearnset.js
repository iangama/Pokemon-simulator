import { toTitle } from '../../utils/formatters';

function levelUpEntry(details = []) {
  const levelUp = details
    .filter((entry) => entry.move_learn_method?.name === 'level-up')
    .sort((a, b) => (b.level_learned_at || 0) - (a.level_learned_at || 0));
  return levelUp[0] || null;
}

export function getNewLevelUpMoves(pokemonData, fromLevel, toLevel, knownMoveSlugs = []) {
  if (!pokemonData?.moves) return [];
  const known = new Set(knownMoveSlugs);
  const candidates = pokemonData.moves
    .map((entry) => {
      const learned = levelUpEntry(entry.version_group_details || []);
      if (!learned) return null;
      const learnedAt = learned.level_learned_at || 0;
      if (learnedAt <= fromLevel || learnedAt > toLevel) return null;
      const slug = entry.move?.name;
      if (!slug || known.has(slug)) return null;
      return { slug, learnedAt };
    })
    .filter(Boolean)
    .sort((a, b) => a.learnedAt - b.learnedAt);

  const unique = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    unique.push(candidate);
  }

  return unique;
}

export function toLearnableMove(moveDetail, slug) {
  return {
    id: slug,
    name: toTitle(slug),
    slug,
    power: moveDetail?.power || 40,
    type: moveDetail?.type?.name || 'normal',
    accuracy: moveDetail?.accuracy || 100,
    damageClass: moveDetail?.damage_class?.name || 'physical',
    pp: moveDetail?.pp || 20,
    currentPp: moveDetail?.pp || 20,
  };
}
