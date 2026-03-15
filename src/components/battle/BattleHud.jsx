import StatBar from '../common/StatBar';

export default function BattleHud({ player, enemy }) {
  if (!player || !enemy) return null;
  return (
    <div className="battle-hud">
      <div className="hud-card">
        <h4>{enemy.name} Lv{enemy.level}</h4>
        <StatBar value={enemy.currentHp} max={enemy.stats.hp} label={`${enemy.name} HP`} flashOnDecrease />
        <div>HP: {enemy.currentHp}/{enemy.stats.hp}</div>
        {enemy.status && <div>Status: {enemy.status}</div>}
      </div>
      <div className="hud-card">
        <h4>{player.name} Lv{player.level}</h4>
        <StatBar value={player.currentHp} max={player.stats.hp} label={`${player.name} HP`} flashOnDecrease />
        <div>HP: {player.currentHp}/{player.stats.hp}</div>
        {player.status && <div>Status: {player.status}</div>}
      </div>
    </div>
  );
}
