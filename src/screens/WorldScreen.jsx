import { useEffect, useState } from 'react';
import { AREAS } from '../data/areas';
import { TRAINERS } from '../data/trainers';
import { EXPEDITIONS } from '../data/expeditions';
import WorldMap from '../components/world/WorldMap';
import QuestLogPanel from '../components/world/QuestLogPanel';
import { SCREENS } from '../utils/constants';
import { AREA_MAPS, getMapPresetById } from '../data/areaMaps';
import { WORLD_NPCS } from '../data/quests';
import { AREA_BOSSES, DAILY_WORLD_EVENTS, QUEST_PATH_CHOICES } from '../data/worldSystems';
import { getTrackedQuestGuidance, getTrackedQuestTargetNpc, getNpcQuestMarker } from '../engine/questEngine';

export default function WorldScreen({ state, actions }) {
  const area = AREAS[state.world.areaId];
  const neighbors = area.neighbors.map((id) => AREAS[id]).filter(Boolean);
  const trainers = (area.trainers || []).map((id) => TRAINERS[id]).filter(Boolean);
  const mapData = AREA_MAPS[state.world.areaId];
  const preset = getMapPresetById(state.world.mapPreset);
  const npcs = WORLD_NPCS[state.world.areaId] || [];
  const guidance = getTrackedQuestGuidance(state.quests);
  const targetNpc = getTrackedQuestTargetNpc(state.quests);
  const discoveredAreas = state.world.discoveredAreas || [];
  const worldSystems = state.worldSystems || {};
  const dailyEvent = DAILY_WORLD_EVENTS.find((entry) => entry.id === worldSystems.dailyEventId) || DAILY_WORLD_EVENTS[0];
  const pathChoice = QUEST_PATH_CHOICES.find((entry) => entry.id === worldSystems.pathChoice) || QUEST_PATH_CHOICES[0];
  const areaBoss = AREA_BOSSES[state.world.areaId] || null;
  const bossDefeated = areaBoss ? !!worldSystems?.bossesDefeated?.[areaBoss.id] : false;
  const bossLocked = areaBoss?.unlockFlag && !(state.world.flags || []).includes(areaBoss.unlockFlag);
  const hubTypes = new Set(['town', 'center', 'shop', 'gym', 'tower']);
  const fastTravelOptions = discoveredAreas
    .map((id) => AREAS[id])
    .filter((entry) => entry && hubTypes.has(entry.type) && entry.id !== state.world.areaId);
  const npcQuestMarkers = Object.fromEntries(
    npcs.map((npc) => [npc.id, getNpcQuestMarker({ npcId: npc.id, quests: state.quests })])
  );
  const [npcFrame, setNpcFrame] = useState(0);
  const [expeditionLeadUid, setExpeditionLeadUid] = useState(state.team[0]?.uid || null);
  const expeditions = Object.values(EXPEDITIONS);

  useEffect(() => {
    function onKeyDown(event) {
      const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = keyMap[event.key];
      if (event.key === 'Enter' || event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        actions.interactNpc();
        return;
      }
      if (!dir) return;
      event.preventDefault();
      actions.movePlayer(dir);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions]);

  useEffect(() => {
    const id = setInterval(() => {
      setNpcFrame((value) => (value + 1) % 2);
    }, 260);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.team.length) {
      setExpeditionLeadUid(null);
      return;
    }
    if (!state.team.some((entry) => entry.uid === expeditionLeadUid)) {
      setExpeditionLeadUid(state.team[0].uid);
    }
  }, [state.team, expeditionLeadUid]);

  return (
    <div className="screen">
      <div className="two-col">
        <WorldMap
          area={area}
          mapData={mapData}
          world={state.world}
          npcFrame={npcFrame}
          mapPreset={preset}
          currentAreaId={state.world.areaId}
          areas={AREAS}
          neighbors={neighbors}
          trainers={trainers.filter((t) => !state.world.defeatedTrainers[t.id])}
          onTravel={actions.moveToArea}
          onTeleport={actions.teleportToArea}
          onFastTravel={actions.fastTravel}
          fastTravelOptions={fastTravelOptions}
          onMove={actions.movePlayer}
          onWalk={actions.walkStep}
          onTrainer={actions.challengeTrainer}
          onGym={() => actions.setScreen(SCREENS.GYM)}
          onInteractNpc={actions.interactNpc}
          npcs={npcs}
          npcQuestMarkers={npcQuestMarkers}
          questTargetAreaId={guidance?.targetAreaId || null}
          targetNpcId={targetNpc?.id || null}
          targetNpcName={targetNpc?.name || null}
          targetNpcAreaId={targetNpc?.areaId || null}
          targetNpcPos={targetNpc ? { x: targetNpc.x, y: targetNpc.y } : null}
          quests={state.quests}
        />
        <div className="stack">
          <div className="panel">
            <h3>World Systems</h3>
            <div className="stack">
              <div className="list-row"><span>Clima</span><strong>{worldSystems.weather || 'clear'}</strong></div>
              <div className="list-row"><span>Periodo</span><strong>{worldSystems.timeOfDay || 'day'}</strong></div>
              <div className="list-row"><span>Evento Diario</span><strong>{dailyEvent?.name || 'Dia comum'}</strong></div>
              <div className="list-row"><span>Caminho Atual</span><strong>{pathChoice?.name || 'Balanceado'}</strong></div>
            </div>
            {guidance && (
              <div className="quest-guidance-box">
                <strong>O que fazer agora</strong>
                <p>{guidance.objectiveText}</p>
                {targetNpc && (
                  <small>
                    Fale com <strong>{targetNpc.name}</strong>
                    {' '}em <strong>{AREAS[targetNpc.areaId]?.name || targetNpc.areaId}</strong>.
                    {' '}Posicao no mapa: ({targetNpc.x}, {targetNpc.y})
                  </small>
                )}
              </div>
            )}
            {areaBoss && (
              <div className="quest-guidance-box">
                <strong>Boss da area: {areaBoss.name}</strong>
                <p>
                  {bossDefeated
                    ? 'Derrotado.'
                    : bossLocked
                      ? `Bloqueado. Complete o requisito ${areaBoss.unlockFlag}.`
                      : `Nivel sugerido ${areaBoss.level}.`}
                </p>
                <button onClick={actions.challengeAreaBoss} disabled={bossDefeated || bossLocked}>
                  {bossDefeated ? 'Boss derrotado' : 'Desafiar Boss'}
                </button>
              </div>
            )}
            {state.world.areaId === 'legendTower' && (
              <div className="quest-guidance-box">
                <strong>Legend Tower</strong>
                <p>
                  {state.worldSystems?.legendTower?.completed
                    ? 'Torre concluida. Todos os andares finalizados.'
                    : `Andar atual: ${state.worldSystems?.legendTower?.currentFloor || 1}`}
                </p>
                <button
                  onClick={actions.challengeLegendTowerFloor}
                  disabled={!(state.world.flags || []).includes('ALL_GYMS_CLEAR') || !!state.worldSystems?.legendTower?.completed}
                >
                  {state.worldSystems?.legendTower?.completed ? 'Concluida' : 'Desafiar Andar'}
                </button>
              </div>
            )}
            <div className="mini-grid">
              <button onClick={actions.runBattleTower}>Rodar Battle Tower</button>
              <button onClick={actions.refreshDailyWorld}>Atualizar clima/evento</button>
              <button onClick={actions.reviveSatelliteBosses}>Reviver bosses satelite</button>
            </div>
          </div>

          <div className="panel">
            <h3>Expedicoes (XP Principal)</h3>
            <div className="mini-grid">
              <span>Lider da expedicao:</span>
              <select value={expeditionLeadUid || ''} onChange={(event) => setExpeditionLeadUid(event.target.value)}>
                {state.team.map((pokemon) => (
                  <option key={pokemon.uid} value={pokemon.uid}>
                    {pokemon.name} (Lv {pokemon.level})
                  </option>
                ))}
              </select>
            </div>
            <div className="stack">
              {expeditions.map((expedition) => {
                const phaseIndex = Number(state.expeditions?.progress?.[expedition.id] || 0);
                const isDone = phaseIndex >= expedition.phases.length;
                const unlocked = discoveredAreas.includes(expedition.unlockAreaId);
                const phase = expedition.phases[phaseIndex];
                const phaseAreaKnown = phase ? discoveredAreas.includes(phase.areaId) : true;
                return (
                  <div key={expedition.id} className="quest-card">
                    <strong>{expedition.name}</strong>
                    <small>{expedition.description}</small>
                    <small>
                      Progresso: {Math.min(phaseIndex, expedition.phases.length)}/{expedition.phases.length}
                    </small>
                    {!isDone && phase && (
                      <small>
                        Atual: {phase.name} | Area: {AREAS[phase.areaId]?.name || phase.areaId} | Lv sugerido {phase.recommendedLevel}
                      </small>
                    )}
                    {isDone && <small>Concluida.</small>}
                    <button
                      onClick={() => actions.runExpedition(expedition.id, expeditionLeadUid)}
                      disabled={!expeditionLeadUid || !unlocked || isDone || !phaseAreaKnown}
                    >
                      {isDone ? 'Concluida' : 'Executar fase'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <QuestLogPanel
            quests={state.quests}
            reputation={state.reputation}
            achievements={state.achievements}
            onTrackQuest={actions.trackQuest}
          />
        </div>
      </div>
    </div>
  );
}
