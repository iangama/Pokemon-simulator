export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function chance(probability) {
  return Math.random() <= probability;
}

export function pickWeighted(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = Math.random() * total;
  let cursor = 0;
  for (const entry of entries) {
    cursor += entry.weight;
    if (roll <= cursor) {
      return entry;
    }
  }
  return entries[0];
}
