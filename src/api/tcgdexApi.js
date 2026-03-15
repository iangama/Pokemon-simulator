import { getJson } from './apiClient';

const TCGDEX_BASE = 'https://api.tcgdex.net/v2';

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const full = query.toString();
  return full ? `?${full}` : '';
}

export async function tcgdexListCards(lang = 'en', params = {}) {
  return getJson(`${TCGDEX_BASE}/${lang}/cards${buildQuery(params)}`);
}

export async function tcgdexGetCard(cardId, lang = 'en') {
  return getJson(`${TCGDEX_BASE}/${lang}/cards/${cardId}`);
}

export async function tcgdexListSets(lang = 'en', params = {}) {
  return getJson(`${TCGDEX_BASE}/${lang}/sets${buildQuery(params)}`);
}

export async function tcgdexGetSet(setId, lang = 'en') {
  return getJson(`${TCGDEX_BASE}/${lang}/sets/${setId}`);
}

export async function tcgdexListSeries(lang = 'en', params = {}) {
  return getJson(`${TCGDEX_BASE}/${lang}/series${buildQuery(params)}`);
}

export async function tcgdexGetSerie(serieId, lang = 'en') {
  return getJson(`${TCGDEX_BASE}/${lang}/series/${serieId}`);
}
