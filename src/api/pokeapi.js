import { getJson } from './apiClient';

const POKE_BASE = 'https://pokeapi.co/api/v2';

export async function fetchPokemonPage(limit = 151, offset = 0) {
  return getJson(`${POKE_BASE}/pokemon?limit=${limit}&offset=${offset}`);
}

export async function fetchPokemonByNameOrId(idOrName) {
  return getJson(`${POKE_BASE}/pokemon/${idOrName}`);
}

export async function fetchPokemonSpecies(idOrName) {
  return getJson(`${POKE_BASE}/pokemon-species/${idOrName}`);
}

export async function fetchEvolutionChainByUrl(url) {
  return getJson(url);
}

export async function fetchMoveByNameOrId(idOrName) {
  return getJson(`${POKE_BASE}/move/${idOrName}`);
}

export async function fetchTypeByNameOrId(idOrName) {
  return getJson(`${POKE_BASE}/type/${idOrName}`);
}
