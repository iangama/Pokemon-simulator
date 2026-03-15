import { AREAS } from '../data/areas';

export function getAreaById(areaId) {
  return AREAS[areaId];
}

export function listConnectedAreas(areaId) {
  return (AREAS[areaId]?.neighbors || []).map((id) => AREAS[id]).filter(Boolean);
}
