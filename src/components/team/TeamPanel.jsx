import TeamMemberCard from './TeamMemberCard';
import { ITEMS } from '../../data/items';

export default function TeamPanel({ team, onUsePotion, onEvolve, onEvolveWithItem, getItemEvolutions }) {
  return (
    <div className="panel">
      <h2>Team</h2>
      <div className="stack">
        {team.map((pokemon) => (
          <TeamMemberCard
            key={pokemon.uid}
            pokemon={pokemon}
            actions={(
              <div className="stack">
                <button onClick={() => onUsePotion?.(pokemon.uid)}>Use Potion</button>
                {pokemon.evolutionReady && (
                  <button onClick={() => onEvolve?.(pokemon.uid)}>Evolve</button>
                )}
                {(getItemEvolutions?.(pokemon.uid) || []).map((entry) => (
                  <button key={`${pokemon.uid}-${entry.itemId}`} onClick={() => onEvolveWithItem?.(pokemon.uid, entry.itemId)}>
                    Evolve with {ITEMS[entry.itemId]?.name || entry.itemId}
                  </button>
                ))}
              </div>
            )}
          />
        ))}
      </div>
    </div>
  );
}
