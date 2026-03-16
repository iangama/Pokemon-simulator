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

  if (item.kind === 'energy') {
    const ppRestore = Math.max(0, Number(item.ppRestore || 0));
    if (!ppRestore) return pokemon;
    const nextMoves = (pokemon.moves || []).map((move) => {
      const maxPp = Number(move.pp || 0);
      const currentPp = Number(move.currentPp ?? maxPp);
      return {
        ...move,
        currentPp: Math.min(maxPp, currentPp + ppRestore),
      };
    });
    return { ...pokemon, moves: nextMoves };
  }

  return pokemon;
}
