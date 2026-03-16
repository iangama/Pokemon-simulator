import { useEffect, useState } from 'react';
import { MAX_TEAM_SIZE } from '../../utils/constants';

export default function StoragePanel({ team, storage, onToStorage, onToTeam, onSwapToTeam }) {
  const [swapTargetByStorageUid, setSwapTargetByStorageUid] = useState({});
  const teamFull = team.length >= MAX_TEAM_SIZE;

  useEffect(() => {
    setSwapTargetByStorageUid((prev) => {
      const next = {};
      for (const pokemon of storage) {
        const candidate = prev[pokemon.uid];
        if (candidate && team.some((member) => member.uid === candidate)) {
          next[pokemon.uid] = candidate;
        } else if (team[0]?.uid) {
          next[pokemon.uid] = team[0].uid;
        }
      }
      return next;
    });
  }, [storage, team]);

  return (
    <div className="panel two-col">
      <div>
        <h3>Time</h3>
        {team.map((p) => (
          <div key={p.uid} className="list-row">
            <span>{p.name} Lv{p.level}</span>
            <button onClick={() => onToStorage(p.uid)}>Enviar para reserva</button>
          </div>
        ))}
      </div>
      <div>
        <h3>Reserva (sem limite)</h3>
        {storage.length === 0 && <p>Nenhum Pokemon na reserva.</p>}
        {storage.map((p) => (
          <div key={p.uid} className="storage-row">
            <div className="list-row">
              <span>{p.name} Lv{p.level}</span>
              {!teamFull && <button onClick={() => onToTeam(p.uid)}>Colocar no time</button>}
            </div>
            {teamFull && (
              <div className="storage-swap-controls">
                <select
                  value={swapTargetByStorageUid[p.uid] || team[0]?.uid || ''}
                  onChange={(event) =>
                    setSwapTargetByStorageUid((prev) => ({ ...prev, [p.uid]: event.target.value }))
                  }
                >
                  {team.map((member) => (
                    <option key={member.uid} value={member.uid}>
                      Trocar com {member.name} Lv{member.level}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onSwapToTeam(p.uid, swapTargetByStorageUid[p.uid] || team[0]?.uid)}
                  disabled={!team.length}
                >
                  Trocar para o time
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
