import { useEffect, useMemo, useState } from 'react';

function fallbackSprite(name = 'pokemon', tone = 'enemy') {
  const initial = String(name || 'P').trim().charAt(0).toUpperCase() || 'P';
  const bg = tone === 'player' ? '#5ea4d6' : '#d66a5e';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect x="4" y="4" width="112" height="112" rx="14" fill="${bg}" stroke="#1f2f3a" stroke-width="6"/>
      <circle cx="60" cy="48" r="16" fill="#fff3c4" />
      <rect x="38" y="70" width="44" height="26" rx="8" fill="#fff3c4" />
      <text x="60" y="112" text-anchor="middle" font-size="18" font-family="Verdana, sans-serif" fill="#ffffff">${initial}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function typeMotionClass(pokemon) {
  const types = pokemon?.types || [];
  if (types.includes('electric')) return 'motion-electric';
  if (types.includes('flying')) return 'motion-flying';
  if (types.includes('ghost') || types.includes('psychic')) return 'motion-float';
  if (types.includes('fire')) return 'motion-fire';
  if (types.includes('ice')) return 'motion-ice';
  return 'motion-neutral';
}

export default function BattleArena({
  player,
  enemy,
  playerAnimClass = '',
  enemyAnimClass = '',
  projectile = null,
}) {
  if (!player || !enemy) return null;
  const [introActive, setIntroActive] = useState(true);
  const pairKey = `${player?.uid || 'p'}-${enemy?.uid || 'e'}`;
  useEffect(() => {
    setIntroActive(true);
    const id = setTimeout(() => setIntroActive(false), 580);
    return () => clearTimeout(id);
  }, [pairKey]);

  const enemyMotionClass = useMemo(() => typeMotionClass(enemy), [enemy]);
  const playerMotionClass = useMemo(() => typeMotionClass(player), [player]);

  return (
    <div className="battle-arena">
      {projectile && (
        <div
          className={`battle-projectile battle-projectile-${projectile.from || 'player'} type-${projectile.type || 'normal'}`}
          aria-hidden="true"
        />
      )}
      <div className="enemy-zone">
        <div className={`battle-sprite-wrap battle-idle idle-enemy ${enemyMotionClass} ${introActive ? 'battle-entry-enemy' : ''} ${enemyAnimClass}`}>
          <img
            src={enemy.spriteFront || fallbackSprite(enemy.name, 'enemy')}
            alt={enemy.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackSprite(enemy.name, 'enemy');
            }}
          />
        </div>
      </div>
      <div className="player-zone">
        <div className={`battle-sprite-wrap battle-idle idle-player ${playerMotionClass} ${introActive ? 'battle-entry-player' : ''} ${playerAnimClass}`}>
          <img
            src={player.spriteBack || player.spriteFront || fallbackSprite(player.name, 'player')}
            alt={player.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackSprite(player.name, 'player');
            }}
          />
        </div>
      </div>
    </div>
  );
}
