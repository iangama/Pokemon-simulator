import { xpToLevel, xpForNextLevel } from '../pokemon/pokemonGrowth';
import { scaleStats } from '../pokemon/pokemonStats';

export function applyXp(pokemon, gainedXp) {
  const previousLevel = pokemon.level;
  let currentXp = pokemon.currentXp + gainedXp;
  let level = pokemon.level;
  let leveledUp = false;

  while (level < 100 && currentXp >= xpToLevel(level + 1)) {
    level += 1;
    leveledUp = true;
  }

  const nextStats = leveledUp ? scaleStats(pokemon.baseStats, level) : pokemon.stats;
  const hpDelta = (nextStats.hp || pokemon.stats.hp) - pokemon.stats.hp;

  return {
    pokemon: {
      ...pokemon,
      level,
      currentXp,
      xpToNextLevel: xpForNextLevel(level),
      stats: nextStats,
      currentHp: Math.max(1, pokemon.currentHp + hpDelta),
      fainted: pokemon.currentHp + hpDelta <= 0,
    },
    leveledUp,
    previousLevel,
    newLevel: level,
  };
}
