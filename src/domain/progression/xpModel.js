export function xpFromVictory(opponentLevel, baseExperienceYield = 50) {
  return Math.max(8, Math.floor((baseExperienceYield * opponentLevel) / 7));
}

export function distributedXpForTeam(team, opponentLevel, baseExperienceYield = 50) {
  const living = team.filter((member) => !member.fainted);
  if (living.length === 0) return {};

  const totalTeamLevel = living.reduce((sum, member) => sum + member.level, 0);
  const baseXp = xpFromVictory(opponentLevel, baseExperienceYield);
  const result = {};

  for (const member of living) {
    const levelGapBonus = Math.max(0.8, Math.min(1.7, (opponentLevel + 2) / Math.max(1, member.level)));
    const participationShare = member.level / Math.max(1, totalTeamLevel);
    const xp = Math.floor(baseXp * levelGapBonus * (0.45 + participationShare));
    result[member.uid] = Math.max(4, xp);
  }

  return result;
}
