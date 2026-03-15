import { CACHE_KEY } from '../utils/constants';
import { readLocalJson, writeLocalJson } from '../utils/storage';

const memoryCache = new Map();
const persistent = readLocalJson(CACHE_KEY, {});

export function getCached(key, maxAgeMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const mem = memoryCache.get(key);
  if (mem && now - mem.ts <= maxAgeMs) return mem.value;

  const disk = persistent[key];
  if (disk && now - disk.ts <= maxAgeMs) {
    memoryCache.set(key, disk);
    return disk.value;
  }
  return null;
}

export function setCached(key, value) {
  const record = { ts: Date.now(), value };
  memoryCache.set(key, record);
  persistent[key] = record;
  writeLocalJson(CACHE_KEY, persistent);
}
