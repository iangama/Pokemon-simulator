export function readLocalJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

export function writeLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeLocalKey(key) {
  localStorage.removeItem(key);
}
