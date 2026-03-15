export function appendBattleLog(state, message) {
  return {
    ...state,
    log: [...state.log.slice(-20), message],
  };
}
