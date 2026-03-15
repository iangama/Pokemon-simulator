import { extractBaseStats, scaleStats } from './pokemonStats';
import { buildInitialMoveSet } from './pokemonMoves';
import { xpToLevel, xpForNextLevel } from './pokemonGrowth';
import { toTitle } from '../../utils/formatters';

const NATURES = [
  { id: 'hardy', name: 'Hardy', up: null, down: null },
  { id: 'adamant', name: 'Adamant', up: 'attack', down: 'specialAttack' },
  { id: 'modest', name: 'Modest', up: 'specialAttack', down: 'attack' },
  { id: 'jolly', name: 'Jolly', up: 'speed', down: 'specialAttack' },
  { id: 'bold', name: 'Bold', up: 'defense', down: 'attack' },
  { id: 'calm', name: 'Calm', up: 'specialDefense', down: 'attack' },
];

function pickNature() {
  return NATURES[Math.floor(Math.random() * NATURES.length)] || NATURES[0];
}

function applyNature(stats, nature) {
  if (!nature?.up || !nature?.down || nature.up === nature.down) return stats;
  return {
    ...stats,
    [nature.up]: Math.max(1, Math.floor((stats[nature.up] || 1) * 1.05)),
    [nature.down]: Math.max(1, Math.floor((stats[nature.down] || 1) * 0.95)),
  };
}

export function createPokemonEntity({ pokemonData, speciesData, level = 5, owner = 'player' }) {
  const baseStats = extractBaseStats(pokemonData);
  const nature = pickNature();
  const scaled = applyNature(scaleStats(baseStats, level), nature);

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
    nature,
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
