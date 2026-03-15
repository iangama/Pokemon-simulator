import { TYPE_CHART } from '../../data/typeChart';

export function getTypeMultiplier(moveType, defenderTypes = []) {
  if (!moveType || defenderTypes.length === 0) return 1;
  return defenderTypes.reduce((multiplier, type) => {
    const chart = TYPE_CHART[moveType] || {};
    return multiplier * (chart[type] ?? 1);
  }, 1);
}
