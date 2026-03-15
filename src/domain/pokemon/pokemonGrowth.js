export function xpToLevel(level) {
  return Math.floor(4 * Math.pow(level, 3) / 5);
}

export function xpForNextLevel(level) {
  return xpToLevel(level + 1) - xpToLevel(level);
}
