import { useEffect, useState } from 'react';
import { AREAS } from '../data/areas';
import { TRAINERS } from '../data/trainers';
import WorldMap from '../components/world/WorldMap';
import QuestLogPanel from '../components/world/QuestLogPanel';
import { SCREENS } from '../utils/constants';
import { AREA_MAPS, getMapPresetById } from '../data/areaMaps';
import { WORLD_NPCS } from '../data/quests';

export default function WorldScreen({ state, actions }) {
  const area = AREAS[state.world.areaId];
  const neighbors = area.neighbors.map((id) => AREAS[id]).filter(Boolean);
  const trainers = (area.trainers || []).map((id) => TRAINERS[id]).filter(Boolean);
  const mapData = AREA_MAPS[state.world.areaId];
  const preset = getMapPresetById(state.world.mapPreset);
  const npcs = WORLD_NPCS[state.world.areaId] || [];
  const [npcFrame, setNpcFrame] = useState(0);

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
          onMove={actions.movePlayer}
          onWalk={actions.walkStep}
          onTrainer={actions.challengeTrainer}
          onGym={() => actions.setScreen(SCREENS.GYM)}
          onInteractNpc={actions.interactNpc}
          npcs={npcs}
          quests={state.quests}
        />
        <QuestLogPanel quests={state.quests} world={state.world} />
      </div>
    </div>
  );
}
