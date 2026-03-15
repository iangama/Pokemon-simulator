function flattenChain(link, output = [], parent = null) {
  const entry = {
    species: link.species?.name,
    evolvesTo: (link.evolves_to || []).map((next) => next.species?.name),
    details: link.evolution_details || [],
    from: parent,
  };
  output.push(entry);
  for (const next of link.evolves_to || []) {
    flattenChain(next, output, link.species?.name);
  }
  return output;
}

function getNextEvolutionSpecies(chainData, currentSpecies) {
  if (!chainData?.chain) return null;
  const flat = flattenChain(chainData.chain);
  const current = flat.find((entry) => entry.species === currentSpecies);
  if (!current || current.evolvesTo.length === 0) return null;
  return current.evolvesTo[0];
}

export function getEvolutionRequirementLevel(pokemon) {
  if (pokemon.caughtAsEvolved) {
    return pokemon.nextEvolutionLevel || pokemon.level + 3;
  }
  if ((pokemon.evolutionCount || 0) <= 0) return 6;
  return 9;
}

export function getEvolutionReadiness(chainData, pokemon) {
  const targetSpecies = getNextEvolutionSpecies(chainData, pokemon.species);
  if (!targetSpecies) return { canEvolve: false, targetSpecies: null, requiredLevel: null };

  const requiredLevel = getEvolutionRequirementLevel(pokemon);
  const canEvolve = pokemon.level >= requiredLevel;
  return {
    canEvolve,
    targetSpecies,
    requiredLevel,
  };
}
