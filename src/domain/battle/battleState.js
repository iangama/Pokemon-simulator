function firstAliveIndex(team = []) {
  return team.findIndex((member) => !member.fainted && member.currentHp > 0);
}

export function createBattleState({ playerTeam, enemyTeam, wild = true, trainerId = null, canRun = true }) {
  const playerActiveIndex = Math.max(0, firstAliveIndex(playerTeam));
  const enemyActiveIndex = Math.max(0, firstAliveIndex(enemyTeam));

  return {
    phase: 'active',
    wild,
    trainerId,
    canRun,
    playerTeam,
    enemyTeam,
    playerActiveIndex,
    enemyActiveIndex,
    playerBuffs: { attack: 1, defense: 1, guardSpec: false },
    enemyBuffs: { attack: 1, defense: 1, guardSpec: false },
    log: ['A batalha comecou!'],
    result: null,
  };
}

export function getActivePokemon(battleState) {
  return {
    player: battleState.playerTeam[battleState.playerActiveIndex],
    enemy: battleState.enemyTeam[battleState.enemyActiveIndex],
  };
}
