import { useState } from 'react';
import NewGameForm from '../components/layout/NewGameForm';
import StarterPicker from '../components/layout/StarterPicker';

export default function NewGameScreen({ starters, mapPresets = [], onStart, saveSlots = [], activeSaveSlot = 1, onSelectSlot }) {
  const [name, setName] = useState('');
  const [mapPreset, setMapPreset] = useState(mapPresets[0]?.id || 'classic');
  const selectedPreset = mapPresets.find((preset) => preset.id === mapPreset) || mapPresets[0];

  return (
    <div className="screen">
      {!name && <NewGameForm onSubmit={setName} />}
      {name && (
        <div className="panel">
          <h2>Choose your starter, {name}</h2>
          <label>
            Save Slot
            <select value={activeSaveSlot} onChange={(event) => onSelectSlot?.(Number(event.target.value))}>
              {[1, 2, 3].map((slotId) => {
                const meta = saveSlots.find((slot) => slot.slot === slotId);
                return (
                  <option key={slotId} value={slotId}>
                    Slot {slotId} {meta?.exists ? `(ocupado: ${meta.playerName})` : '(vazio)'}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Region Map
            <select value={mapPreset} onChange={(event) => setMapPreset(event.target.value)}>
              {mapPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.difficulty})
                </option>
              ))}
            </select>
          </label>
          {selectedPreset && (
            <div className="list-row">
              <span>{selectedPreset.description}</span>
              <strong>Difficulty: {selectedPreset.difficulty}</strong>
            </div>
          )}
          <StarterPicker starters={starters} onPick={(starterName) => onStart(name, starterName, mapPreset, activeSaveSlot)} />
        </div>
      )}
    </div>
  );
}
