import StatBar from '../common/StatBar';

function fallbackSprite(name = 'pokemon') {
  const initial = String(name || 'P').trim().charAt(0).toUpperCase() || 'P';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect x="4" y="4" width="88" height="88" rx="12" fill="#5ea4d6" stroke="#1f2f3a" stroke-width="6"/>
      <circle cx="48" cy="38" r="12" fill="#fff3c4" />
      <rect x="32" y="56" width="32" height="20" rx="6" fill="#fff3c4" />
      <text x="48" y="89" text-anchor="middle" font-size="14" font-family="Verdana, sans-serif" fill="#ffffff">${initial}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function TeamMemberCard({ pokemon, actions }) {
  const nextLevelTotal = Math.floor((4 * Math.pow(pokemon.level + 1, 3)) / 5);
  const currentXp = Number.isFinite(pokemon.currentXp) ? pokemon.currentXp : 0;
  const xpForLevel = Math.floor((4 * Math.pow(pokemon.level, 3)) / 5);
  const xpInLevel = Math.max(0, currentXp - xpForLevel);
  const xpNeeded = Math.max(1, nextLevelTotal - xpForLevel);
  const xpRemaining = Math.max(0, nextLevelTotal - currentXp);
  const totalPp = (pokemon.moves || []).reduce((sum, move) => sum + (move?.pp || 0), 0);
  const currentPp = (pokemon.moves || []).reduce((sum, move) => {
    const fallback = Number(move?.pp || 0);
    const current = Number.isFinite(move?.currentPp) ? move.currentPp : fallback;
    return sum + current;
  }, 0);

  return (
    <div className="team-member">
      <img
        src={pokemon.spriteFront || fallbackSprite(pokemon.name)}
        alt={pokemon.name}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackSprite(pokemon.name);
        }}
      />
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
        <div>Energia: {currentPp}/{Math.max(1, totalPp)}</div>
        <StatBar value={currentPp} max={Math.max(1, totalPp)} label={`${pokemon.name} Energia`} />
        <div>{pokemon.types.join(' / ')}</div>
        <div>Nature: {pokemon.nature?.name || 'Hardy'}</div>
        <div>Ability: {pokemon.abilities?.[0] || 'none'}</div>
        {pokemon.evolutionReady && <div>Ready to Evolve</div>}
      </div>
      {actions}
    </div>
  );
}
