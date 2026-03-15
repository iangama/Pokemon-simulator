export function extractBaseStats(pokemonData) {
  const stats = {};
  for (const item of pokemonData.stats || []) {
    stats[item.stat.name] = item.base_stat;
  }
  return {
    hp: stats.hp || 10,
    attack: stats.attack || 5,
    defense: stats.defense || 5,
    specialAttack: stats['special-attack'] || 5,
    specialDefense: stats['special-defense'] || 5,
    speed: stats.speed || 5,
  };
}

export function scaleStats(baseStats, level) {
  const factor = level / 50;
  return {
    hp: Math.max(10, Math.floor(baseStats.hp + baseStats.hp * factor) + level + 10),
    attack: Math.max(5, Math.floor(baseStats.attack + baseStats.attack * factor * 0.8)),
    defense: Math.max(5, Math.floor(baseStats.defense + baseStats.defense * factor * 0.8)),
    specialAttack: Math.max(5, Math.floor(baseStats.specialAttack + baseStats.specialAttack * factor * 0.8)),
    specialDefense: Math.max(5, Math.floor(baseStats.specialDefense + baseStats.specialDefense * factor * 0.8)),
    speed: Math.max(5, Math.floor(baseStats.speed + baseStats.speed * factor * 0.8)),
  };
}
