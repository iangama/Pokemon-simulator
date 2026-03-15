import { getJson } from './apiClient';

const TCG_BASE = 'https://api.pokemontcg.io/v2';

export async function searchTcgCards({ q = '', page = 1, pageSize = 20, orderBy = '' } = {}) {
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  query.set('page', String(page));
  query.set('pageSize', String(Math.min(pageSize, 250)));
  if (orderBy) query.set('orderBy', orderBy);
  return getJson(`${TCG_BASE}/cards?${query.toString()}`);
}

export async function fetchTcgCardById(id) {
  return getJson(`${TCG_BASE}/cards/${id}`);
}

export async function searchTcgSets({ q = '', page = 1, pageSize = 20 } = {}) {
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  query.set('page', String(page));
  query.set('pageSize', String(Math.min(pageSize, 250)));
  return getJson(`${TCG_BASE}/sets?${query.toString()}`);
}

export async function fetchTcgSetById(id) {
  return getJson(`${TCG_BASE}/sets/${id}`);
}

export async function fetchTcgRarities() {
  return getJson(`${TCG_BASE}/rarities`);
}
