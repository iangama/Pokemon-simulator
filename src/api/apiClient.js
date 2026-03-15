import { getCached, setCached } from './cache';

export async function getJson(url, options = {}) {
  const { cacheKey = url, maxAgeMs, headers } = options;
  if (cacheKey) {
    const cached = getCached(cacheKey, maxAgeMs);
    if (cached) return cached;
  }

  const response = await fetch(url, { method: 'GET', headers: headers || {} });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  if (cacheKey) setCached(cacheKey, json);
  return json;
}
