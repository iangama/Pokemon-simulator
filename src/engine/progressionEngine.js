import { applyXp } from '../domain/progression/levelModel';
import { distributedXpForTeam } from '../domain/progression/xpModel';
import { rewardMoney } from '../domain/progression/moneyModel';

export function applyBattleRewards({ playerTeam, defeatedPokemon, money, moneyReward = 0 }) {
  const xpByPokemon = distributedXpForTeam(
    playerTeam,
    defeatedPokemon.level,
    defeatedPokemon.baseExperienceYield
  );

  let leveledUp = false;
  const levelUpsByPokemon = {};
  const updatedTeam = playerTeam.map((member) => {
    const gained = xpByPokemon[member.uid] || 0;
    if (gained <= 0) return member;
    const result = applyXp(member, gained);
    if (result.leveledUp) leveledUp = true;
    if (result.leveledUp) {
      levelUpsByPokemon[member.uid] = {
        previousLevel: result.previousLevel,
        newLevel: result.newLevel,
      };
    }
    return result.pokemon;
  });

  return {
    playerTeam: updatedTeam,
    leveledUp,
    levelUpsByPokemon,
    xpByPokemon,
    money: rewardMoney(money, moneyReward),
  };
}
