import { ENCOUNTERS_BY_AREA } from '../data/encounters';
import { pickWeighted, randomInt, chance } from '../utils/random';

export function shouldTriggerEncounter(area, steps) {
  if (!area?.canEncounter) return false;
  const baseChance = 0.14;
  const stepBonus = Math.min(0.08, steps * 0.005);
  return chance(baseChance + stepBonus);
}

export function rollEncounter(areaId) {
  const table = ENCOUNTERS_BY_AREA[areaId] || [];
  if (!table.length) return null;
  const pick = pickWeighted(table);
  const level = randomInt(pick.minLevel, pick.maxLevel);
  return { species: pick.species, level };
}
