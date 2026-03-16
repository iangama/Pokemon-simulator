import { useEffect, useMemo, useState } from 'react';
import TeamMemberCard from './TeamMemberCard';
import { ITEMS } from '../../data/items';

function sumStats(team = []) {
  return team.reduce((acc, pokemon) => ({
    hp: acc.hp + (pokemon.stats?.hp || 0),
    attack: acc.attack + (pokemon.stats?.attack || 0),
    defense: acc.defense + (pokemon.stats?.defense || 0),
    speed: acc.speed + (pokemon.stats?.speed || 0),
  }), { hp: 0, attack: 0, defense: 0, speed: 0 });
}

export default function TeamPanel({
  team,
  inventory = {},
  storage = [],
  daycare,
  onUseItem,
  onEvolve,
  onEvolveWithItem,
  getItemEvolutions,
  onDepositDaycare,
  onWithdrawDaycare,
  onHatchEgg,
  onTrainWithPokemon,
}) {
  const [simA, setSimA] = useState([]);
  const [simB, setSimB] = useState([]);
  const [targetUid, setTargetUid] = useState(team[0]?.uid || null);

  const simAStats = useMemo(() => sumStats(team.filter((pokemon) => simA.includes(pokemon.uid))), [team, simA]);
  const simBStats = useMemo(() => sumStats(team.filter((pokemon) => simB.includes(pokemon.uid))), [team, simB]);
  const trainSources = useMemo(
    () => [
      ...storage.map((pokemon) => ({ pokemon, origin: 'storage' })),
      ...team
        .filter((pokemon) => pokemon.uid !== targetUid && team.length > 1)
        .map((pokemon) => ({ pokemon, origin: 'team' })),
    ],
    [storage, team, targetUid]
  );
  const usableItems = useMemo(
    () => Object.entries(inventory || {})
      .filter(([itemId, qty]) => {
        const kind = ITEMS[itemId]?.kind;
        if (!qty || qty <= 0) return false;
        return ['healing', 'revive', 'status', 'status-heal', 'energy'].includes(kind);
      })
      .map(([itemId, qty]) => ({ itemId, qty })),
    [inventory]
  );
  const [selectedItemId, setSelectedItemId] = useState(usableItems[0]?.itemId || 'potion');

  useEffect(() => {
    if (!team.length) {
      setTargetUid(null);
      return;
    }
    if (!team.some((pokemon) => pokemon.uid === targetUid)) {
      setTargetUid(team[0].uid);
    }
  }, [team, targetUid]);

  useEffect(() => {
    if (!usableItems.length) {
      setSelectedItemId('');
      return;
    }
    if (!usableItems.some((entry) => entry.itemId === selectedItemId)) {
      setSelectedItemId(usableItems[0].itemId);
    }
  }, [usableItems, selectedItemId]);

  function toggleSim(setter, selected, uid) {
    if (selected.includes(uid)) {
      setter(selected.filter((value) => value !== uid));
      return;
    }
    if (selected.length >= 3) return;
    setter([...selected, uid]);
  }

  return (
    <div className="panel">
      <h2>Team</h2>
      <div className="quest-card">
        <strong>Usar Item no Time</strong>
        <div className="mini-grid">
          <select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
            {usableItems.length ? usableItems.map((entry) => (
              <option key={entry.itemId} value={entry.itemId}>
                {ITEMS[entry.itemId]?.name || entry.itemId} (x{entry.qty})
              </option>
            )) : <option value="">Sem itens disponiveis</option>}
          </select>
          <small>
            Item selecionado: <strong>{ITEMS[selectedItemId]?.name || 'Nenhum'}</strong>
          </small>
        </div>
      </div>
      <div className="stack">
        {team.map((pokemon) => (
          <TeamMemberCard
            key={pokemon.uid}
            pokemon={pokemon}
            actions={(
              <div className="stack">
                <button
                  onClick={() => onUseItem?.(selectedItemId, pokemon.uid)}
                  disabled={!selectedItemId || !usableItems.length}
                >
                  Usar {ITEMS[selectedItemId]?.name || 'item'}
                </button>
                {pokemon.evolutionReady && (
                  <button onClick={() => onEvolve?.(pokemon.uid)}>Evolve</button>
                )}
                {(getItemEvolutions?.(pokemon.uid) || []).map((entry) => (
                  <button key={`${pokemon.uid}-${entry.itemId}`} onClick={() => onEvolveWithItem?.(pokemon.uid, entry.itemId)}>
                    Evolve with {ITEMS[entry.itemId]?.name || entry.itemId}
                  </button>
                ))}
                <button onClick={() => onDepositDaycare?.(pokemon.uid)}>Enviar para Daycare</button>
                <button onClick={() => toggleSim(setSimA, simA, pokemon.uid)}>Sim A</button>
                <button onClick={() => toggleSim(setSimB, simB, pokemon.uid)}>Sim B</button>
              </div>
            )}
          />
        ))}
      </div>

      <h3>Daycare</h3>
      <div className="mini-grid">
        {(daycare?.slots || []).map((slot) => (
          <span key={slot.uid} className="list-row">
            {slot.name}
            <button onClick={() => onWithdrawDaycare?.(slot.uid)}>Retirar</button>
          </span>
        ))}
        {!(daycare?.slots || []).length && <span className="list-row">Nenhum Pokemon no daycare.</span>}
      </div>

      <h3>Eggs</h3>
      <div className="mini-grid">
        {(daycare?.eggs || []).map((egg) => (
          <span key={egg.id} className="list-row">
            Egg de {egg.species} ({egg.progress}/{egg.hatchSteps})
            <button onClick={() => onHatchEgg?.(egg.id)} disabled={egg.progress < egg.hatchSteps}>Chocar</button>
          </span>
        ))}
        {!(daycare?.eggs || []).length && <span className="list-row">Sem eggs no momento.</span>}
      </div>

      <h3>Team Simulator</h3>
      <div className="two-col">
        <div className="quest-card">
          <strong>Formacao A ({simA.length}/3)</strong>
          <small>HP {simAStats.hp} | ATK {simAStats.attack} | DEF {simAStats.defense} | SPD {simAStats.speed}</small>
        </div>
        <div className="quest-card">
          <strong>Formacao B ({simB.length}/3)</strong>
          <small>HP {simBStats.hp} | ATK {simBStats.attack} | DEF {simBStats.defense} | SPD {simBStats.speed}</small>
        </div>
      </div>

      <h3>Treinamento por Transferencia de XP</h3>
      <div className="quest-card">
        <div className="mini-grid">
          <span>Pokemon alvo:</span>
          <select value={targetUid || ''} onChange={(event) => setTargetUid(event.target.value)}>
            {team.map((pokemon) => (
              <option key={pokemon.uid} value={pokemon.uid}>
                {pokemon.name} (Lv {pokemon.level})
              </option>
            ))}
          </select>
        </div>
        <small>
          Use um Pokemon do storage (ou do proprio time) para conceder muito XP ao alvo.
          O Pokemon usado sera consumido.
        </small>
      </div>
      <div className="mini-grid">
        {trainSources.map(({ pokemon, origin }) => (
          <span key={`${origin}-${pokemon.uid}`} className="list-row">
            <span>
              {pokemon.name} Lv {pokemon.level} ({origin === 'storage' ? 'storage' : 'time'})
            </span>
            <button onClick={() => onTrainWithPokemon?.(targetUid, pokemon.uid)} disabled={!targetUid}>
              Treinar alvo
            </button>
          </span>
        ))}
        {!trainSources.length && <span className="list-row">Sem Pokemon disponiveis para transferencia.</span>}
      </div>
    </div>
  );
}
