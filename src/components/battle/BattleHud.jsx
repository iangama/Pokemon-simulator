import StatBar from '../common/StatBar';

export default function BattleHud({
  player,
  enemy,
  playerAnimClass = '',
  enemyAnimClass = '',
}) {
  if (!player || !enemy) return null;
  const enemyPpMax = (enemy.moves || []).reduce((sum, move) => sum + (move?.pp || 0), 0);
  const enemyPpNow = (enemy.moves || []).reduce((sum, move) => sum + (Number.isFinite(move?.currentPp) ? move.currentPp : (move?.pp || 0)), 0);
  const playerPpMax = (player.moves || []).reduce((sum, move) => sum + (move?.pp || 0), 0);
  const playerPpNow = (player.moves || []).reduce((sum, move) => sum + (Number.isFinite(move?.currentPp) ? move.currentPp : (move?.pp || 0)), 0);
  return (
    <div className="battle-hud">
      <div className={`hud-card ${enemyAnimClass}`}>
        <h4>{enemy.name} Lv{enemy.level}</h4>
        <StatBar value={enemy.currentHp} max={enemy.stats.hp} label={`${enemy.name} HP`} flashOnDecrease />
        <div>HP: {enemy.currentHp}/{enemy.stats.hp}</div>
        <StatBar value={enemyPpNow} max={Math.max(1, enemyPpMax)} label={`${enemy.name} Energia`} />
        <div>Energia: {enemyPpNow}/{Math.max(1, enemyPpMax)}</div>
        {enemy.status && <div>Status: {enemy.status}</div>}
      </div>
      <div className={`hud-card ${playerAnimClass}`}>
        <h4>{player.name} Lv{player.level}</h4>
        <StatBar value={player.currentHp} max={player.stats.hp} label={`${player.name} HP`} flashOnDecrease />
        <div>HP: {player.currentHp}/{player.stats.hp}</div>
        <StatBar value={playerPpNow} max={Math.max(1, playerPpMax)} label={`${player.name} Energia`} />
        <div>Energia: {playerPpNow}/{Math.max(1, playerPpMax)}</div>
        {player.status && <div>Status: {player.status}</div>}
      </div>
    </div>
  );
}
