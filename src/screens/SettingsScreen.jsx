import { useMemo, useState } from 'react';
import { DAILY_WORLD_EVENTS, QUEST_PATH_CHOICES, TUTORIAL_TIPS } from '../data/worldSystems';
import { WORLD_NPCS } from '../data/quests';
import { AREAS } from '../data/areas';

export default function SettingsScreen({ state, actions }) {
  const [raw, setRaw] = useState('');
  const exportText = useMemo(() => actions.exportCurrentSave(), [actions, state.activeSaveSlot, state.saveSlots]);
  const worldSystems = state.worldSystems || {};
  const dailyEvent = DAILY_WORLD_EVENTS.find((entry) => entry.id === worldSystems.dailyEventId) || DAILY_WORLD_EVENTS[0];
  const npcList = Object.entries(WORLD_NPCS).flatMap(([areaId, npcs]) =>
    (npcs || []).map((npc) => ({ ...npc, areaId }))
  );
  const viewedNpcs = state.profile?.codexViewedNpcs || {};

  return (
    <div className="screen">
      <div className="panel">
        <h2>Settings</h2>
        <p>Audio and text settings are prepared for expansion in V2.</p>

        <h3>World Dashboard</h3>
        <div className="stack">
          <div className="list-row"><span>Dia</span><strong>{worldSystems.dayKey || '-'}</strong></div>
          <div className="list-row"><span>Clima</span><strong>{worldSystems.weather || 'clear'}</strong></div>
          <div className="list-row"><span>Periodo</span><strong>{worldSystems.timeOfDay || 'day'}</strong></div>
          <div className="list-row">
            <span>Evento do dia</span>
            <strong>{dailyEvent?.name || 'Dia comum'}</strong>
          </div>
          <small>{dailyEvent?.description || ''}</small>
          <button onClick={actions.refreshDailyWorld}>Atualizar Snapshot Diario</button>
        </div>

        <h3>Caminho de Jornada</h3>
        <div className="stack">
          {QUEST_PATH_CHOICES.map((choice) => {
            const active = worldSystems.pathChoice === choice.id;
            return (
              <button key={choice.id} onClick={() => actions.setPathChoice(choice.id)}>
                {active ? '● ' : '○ '}
                {choice.name} ({choice.description})
              </button>
            );
          })}
        </div>

        <h3>Battle Tower</h3>
        <div className="stack">
          <div className="list-row"><span>Rank</span><strong>{worldSystems.tower?.rank || 'Bronze'}</strong></div>
          <div className="list-row"><span>Streak</span><strong>{worldSystems.tower?.streak || 0}</strong></div>
          <div className="list-row"><span>Melhor Streak</span><strong>{worldSystems.tower?.bestStreak || 0}</strong></div>
          <button onClick={actions.runBattleTower}>Executar batalha de torre</button>
        </div>

        <h3>Tutorial Journal</h3>
        <div className="stack">
          {Object.entries(TUTORIAL_TIPS).map(([tipId, text]) => (
            <div key={tipId} className="list-row">
              <span>{text}</span>
              <strong>{worldSystems.tutorialTipsSeen?.[tipId] ? 'Visto' : 'Novo'}</strong>
            </div>
          ))}
        </div>

        <h3>NPC Codex</h3>
        <div className="stack">
          {npcList.map((npc) => (
            <div key={npc.id} className="list-row">
              <span>
                <strong>{npc.name}</strong>
                <br />
                {AREAS[npc.areaId]?.name || npc.areaId}
              </span>
              <strong>{viewedNpcs[npc.id] ? 'Conhecido' : 'Nao visto'}</strong>
            </div>
          ))}
        </div>

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
