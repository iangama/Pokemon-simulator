import { AREAS } from '../data/areas';

export function canTravel(currentAreaId, nextAreaId, flags = []) {
  const current = AREAS[currentAreaId];
  if (!current) return false;
  if (!current.neighbors.includes(nextAreaId)) return false;
  const next = AREAS[nextAreaId];
  if (!next?.requires?.length) return true;
  return next.requires.every((flag) => flags.includes(flag));
}
