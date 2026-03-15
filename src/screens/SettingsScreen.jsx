import { useMemo, useState } from 'react';

export default function SettingsScreen({ state, actions }) {
  const [raw, setRaw] = useState('');
  const exportText = useMemo(() => actions.exportCurrentSave(), [actions, state.activeSaveSlot, state.saveSlots]);

  return (
    <div className="screen">
      <div className="panel">
        <h2>Settings</h2>
        <p>Audio and text settings are prepared for expansion in V2.</p>
        <h3>Save Slots</h3>
        <div className="stack">
          {[1, 2, 3].map((slotId) => {
            const meta = state.saveSlots?.find((slot) => slot.slot === slotId);
            return (
              <button key={slotId} onClick={() => actions.setActiveSaveSlot(slotId)}>
                Slot {slotId} {state.activeSaveSlot === slotId ? '(ativo)' : ''} - {meta?.exists ? meta.playerName : 'vazio'}
              </button>
            );
          })}
          <button onClick={actions.manualSave}>Salvar no Slot Ativo</button>
        </div>

        <h3>Export Save</h3>
        <textarea value={exportText} readOnly rows={8} style={{ width: '100%' }} />

        <h3>Import Save</h3>
        <textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={8}
          style={{ width: '100%' }}
          placeholder="Cole aqui o JSON do save"
        />
        <button onClick={() => actions.importSaveToSlot(raw, state.activeSaveSlot || 1)}>Importar para Slot Ativo</button>
        {state.importStatus && <p>{state.importStatus}</p>}
      </div>
    </div>
  );
}
