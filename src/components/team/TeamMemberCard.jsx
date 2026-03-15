import StatBar from '../common/StatBar';

export default function TeamMemberCard({ pokemon, actions }) {
  const nextLevelTotal = Math.floor((4 * Math.pow(pokemon.level + 1, 3)) / 5);
  const currentXp = Number.isFinite(pokemon.currentXp) ? pokemon.currentXp : 0;
  const xpForLevel = Math.floor((4 * Math.pow(pokemon.level, 3)) / 5);
  const xpInLevel = Math.max(0, currentXp - xpForLevel);
  const xpNeeded = Math.max(1, nextLevelTotal - xpForLevel);
  const xpRemaining = Math.max(0, nextLevelTotal - currentXp);

  return (
    <div className="team-member">
      <img src={pokemon.spriteFront} alt={pokemon.name} />
      <div>
        <strong>{pokemon.name}</strong>
        <div>Lv {pokemon.level}</div>
        <div>HP {pokemon.currentHp}/{pokemon.stats.hp}</div>
        <StatBar
          value={Math.max(0, pokemon.currentHp)}
          max={pokemon.stats.hp}
          label={`${pokemon.name} HP`}
          flashOnDecrease
        />
        <div>XP: {xpInLevel}/{xpNeeded} (faltam {xpRemaining})</div>
        <StatBar value={xpInLevel} max={xpNeeded} label={`${pokemon.name} XP`} />
        <div>{pokemon.types.join(' / ')}</div>
        {pokemon.evolutionReady && <div>Ready to Evolve</div>}
      </div>
      {actions}
    </div>
  );
}
