export default function BattleArena({ player, enemy }) {
  if (!player || !enemy) return null;
  return (
    <div className="battle-arena">
      <div className="enemy-zone">
        <img src={enemy.spriteFront} alt={enemy.name} />
      </div>
      <div className="player-zone">
        <img src={player.spriteBack} alt={player.name} />
      </div>
    </div>
  );
}
