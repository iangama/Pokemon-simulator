import { createBattleState } from '../domain/battle/battleState';
import { resolveTurn } from '../domain/battle/turnResolver';

export function startWildBattle(playerTeam, wildPokemon) {
  return createBattleState({ playerTeam, enemyTeam: [wildPokemon], wild: true, canRun: true });
}

export function startTrainerBattle(playerTeam, trainerTeam, trainerId) {
  return createBattleState({ playerTeam, enemyTeam: trainerTeam, wild: false, trainerId, canRun: false });
}

export function runBattleTurn(state, playerMove, enemyMove) {
  return resolveTurn(state, playerMove, enemyMove);
}
