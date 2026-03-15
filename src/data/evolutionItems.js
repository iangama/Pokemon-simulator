export const EVOLUTION_ITEM_MAP = {
  vulpix: { itemId: 'fireStone', targetSpecies: 'ninetales' },
  growlithe: { itemId: 'fireStone', targetSpecies: 'arcanine' },
  eevee: [
    { itemId: 'fireStone', targetSpecies: 'flareon' },
    { itemId: 'waterStone', targetSpecies: 'vaporeon' },
    { itemId: 'thunderStone', targetSpecies: 'jolteon' },
  ],
  poliwhirl: { itemId: 'waterStone', targetSpecies: 'poliwrath' },
  shellder: { itemId: 'waterStone', targetSpecies: 'cloyster' },
  weepinbell: { itemId: 'leafStone', targetSpecies: 'victreebel' },
  gloom: [
    { itemId: 'leafStone', targetSpecies: 'vileplume' },
    { itemId: 'moonStone', targetSpecies: 'bellossom' },
  ],
  exeggcute: { itemId: 'leafStone', targetSpecies: 'exeggutor' },
  pikachu: { itemId: 'thunderStone', targetSpecies: 'raichu' },
  nidorina: { itemId: 'moonStone', targetSpecies: 'nidoqueen' },
  nidorino: { itemId: 'moonStone', targetSpecies: 'nidoking' },
  jigglypuff: { itemId: 'moonStone', targetSpecies: 'wigglytuff' },
  clefairy: { itemId: 'moonStone', targetSpecies: 'clefable' },
  skitty: { itemId: 'moonStone', targetSpecies: 'delcatty' },
  munna: { itemId: 'moonStone', targetSpecies: 'musharna' },
};

export function getItemEvolutionsForSpecies(species) {
  const entry = EVOLUTION_ITEM_MAP[species];
  if (!entry) return [];
  return Array.isArray(entry) ? entry : [entry];
}
