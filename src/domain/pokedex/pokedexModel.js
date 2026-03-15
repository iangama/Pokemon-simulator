export function createPokedex() {
  return {
    seen: {},
    caught: {},
  };
}

export function markSeen(pokedex, species) {
  return {
    ...pokedex,
    seen: { ...pokedex.seen, [species]: true },
  };
}

export function markCaught(pokedex, species) {
  return {
    ...pokedex,
    seen: { ...pokedex.seen, [species]: true },
    caught: { ...pokedex.caught, [species]: true },
  };
}
