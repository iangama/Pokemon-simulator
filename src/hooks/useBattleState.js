import { useGameStore } from '../store/gameStore';

export function useBattleState() {
  const { state, actions } = useGameStore();
  return {
    battle: state.battle,
    doTurn: actions.battleTurn,
    runAway: actions.runFromBattle,
    tryCapture: actions.tryCapture,
    leaveBattle: actions.leaveBattle,
  };
}
