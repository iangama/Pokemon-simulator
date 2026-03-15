export function addBadge(badges, badgeId) {
  if (badges.includes(badgeId)) return badges;
  return [...badges, badgeId];
}
