import { extractBaseStats, scaleStats } from './pokemonStats';
import { buildInitialMoveSet } from './pokemonMoves';
import { xpToLevel, xpForNextLevel } from './pokemonGrowth';
import { toTitle } from '../../utils/formatters';

export function createPokemonEntity({ pokemonData, speciesData, level = 5, owner = 'player' }) {
  const baseStats = extractBaseStats(pokemonData);
  const scaled = scaleStats(baseStats, level);

  const initialMoves = buildInitialMoveSet(pokemonData);

  return {
    uid: `${pokemonData.name}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    owner,
    pokemonId: pokemonData.id,
    speciesId: speciesData.id,
    name: toTitle(speciesData.name || pokemonData.name),
    species: speciesData.name,
    spriteFront: pokemonData.sprites?.front_default || '',
    spriteBack: pokemonData.sprites?.back_default || pokemonData.sprites?.front_default || '',
    types: (pokemonData.types || []).map((t) => t.type.name),
    abilities: (pokemonData.abilities || []).map((a) => a.ability.name),
    level,
    currentXp: xpToLevel(level),
    xpToNextLevel: xpForNextLevel(level),
    baseExperienceYield: pokemonData.base_experience || 50,
    baseStats,
    stats: scaled,
    currentHp: scaled.hp,
    fainted: false,
    status: null,
    moves: initialMoves,
    knownMoveSlugs: initialMoves.map((move) => move.slug),
    evolutionChainUrl: speciesData.evolution_chain?.url || null,
    evolvesFromSpecies: speciesData.evolves_from_species?.name || null,
    capturedAtLevel: level,
    caughtAsEvolved: !!speciesData.evolves_from_species,
    evolutionCount: speciesData.evolves_from_species ? 1 : 0,
    evolutionReady: false,
    nextEvolutionLevel: speciesData.evolves_from_species ? level + 3 : 6,
    captureRate: speciesData.capture_rate || 45,
  };
}
