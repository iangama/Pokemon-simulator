import { ITEMS } from '../../data/items';

export function applyItemToPokemon(pokemon, itemId) {
  const item = ITEMS[itemId];
  if (!item) return pokemon;

  if (item.kind === 'healing') {
    const newHp = Math.min(pokemon.stats.hp, pokemon.currentHp + item.heal);
    return { ...pokemon, currentHp: newHp, fainted: false };
  }

  if (item.kind === 'revive' && pokemon.fainted) {
    const healed = Math.max(1, Math.floor(pokemon.stats.hp * item.heal));
    return { ...pokemon, currentHp: healed, fainted: false };
  }

  if ((item.kind === 'status' || item.kind === 'status-heal') && pokemon.status) {
    return { ...pokemon, status: null };
  }

  return pokemon;
}
