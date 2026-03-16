import { useState } from 'react';
import { QUESTS } from '../../data/quests';

const MAP_LAYOUT = {
  oakwindTown: { x: 30, y: 54 },
  route1: { x: 44, y: 54 },
  sunleafForest: { x: 58, y: 38 },
  route2: { x: 72, y: 54 },
  mistvaleTown: { x: 86, y: 54 },
  azureCoast: { x: 86, y: 36 },
  coralReef: { x: 96, y: 44 },
  tidecrestGym: { x: 96, y: 58 },
  emberCave: { x: 86, y: 20 },
  ironpeakPass: { x: 70, y: 14 },
  crystalLake: { x: 58, y: 12 },
  frostfordTown: { x: 48, y: 10 },
  glacierGym: { x: 40, y: 6 },
  emberfallCity: { x: 30, y: 16 },
  cinderTrail: { x: 20, y: 20 },
  obsidianRidge: { x: 28, y: 28 },
  ashenRuins: { x: 36, y: 26 },
  magmaGym: { x: 20, y: 12 },
  auroraHarbor: { x: 14, y: 34 },
  legendTower: { x: 2, y: 34 },
  galeCliffs: { x: 6, y: 24 },
  tempestBay: { x: 8, y: 40 },
  starfallSanctum: { x: 4, y: 52 },
  stormGym: { x: 16, y: 52 },
  thunderPlateau: { x: 76, y: 8 },
  glacierCavern: { x: 90, y: 10 },
  pokemonCenter: { x: 26, y: 70 },
  itemShop: { x: 36, y: 70 },
  verdantGym: { x: 83, y: 50 },
};

const TYPE_CLASS = {
  town: 'map-node-town',
  route: 'map-node-route',
  forest: 'map-node-forest',
  cave: 'map-node-cave',
  gym: 'map-node-gym',
  tower: 'map-node-tower',
  center: 'map-node-center',
  shop: 'map-node-shop',
};

const TILE_CLASS = {
  '#': 'tile-wall',
  '.': 'tile-path',
  r: 'tile-road',
  g: 'tile-grass',
  h: 'tile-tall-grass',
  t: 'tile-tree',
  '~': 'tile-water',
  f: 'tile-flowers',
  s: 'tile-sand',
};

const TILE_SYMBOL = {
  E: '⇄',
  F: '⇄',
  R: '⇄',
  T: '⇄',
  G: 'GYM',
  B: 'BOSS',
  C: 'PKC',
  S: 'MART',
  L: 'BOSS',
  N: 'TRN',
  P: 'PLZ',
  H: 'HEAL',
  A: '⇄',
  M: '⇄',
  I: '⇄',
};

function connectionKey(a, b) {
  return [a, b].sort().join('__');
}

function areaColor(type) {
  if (type === 'town') return '#f6c85a';
  if (type === 'route') return '#7fbf5f';
  if (type === 'forest') return '#2f8f5b';
  if (type === 'cave') return '#8e9ba7';
  if (type === 'gym') return '#b66ce3';
  if (type === 'tower') return '#b36b1e';
  if (type === 'center') return '#57a0d7';
  if (type === 'shop') return '#db7f47';
  return '#8e9ba7';
}

export default function WorldMap({
  area,
  mapData,
  mapPreset,
  world,
  npcFrame = 0,
  currentAreaId,
  areas = {},
  neighbors,
  onMove,
  onTravel,
  onTeleport,
  onFastTravel,
  fastTravelOptions = [],
  onWalk,
  onTrainer,
  onGym,
  onInteractNpc,
  trainers = [],
  npcs = [],
  npcQuestMarkers = {},
  questTargetAreaId = null,
  targetNpcId = null,
  targetNpcName = null,
  targetNpcAreaId = null,
  targetNpcPos = null,
  quests,
}) {
  const [globalMapOpen, setGlobalMapOpen] = useState(false);
  const connectedIds = new Set(neighbors.map((item) => item.id));
  const mapNodes = Object.values(areas).filter((node) => MAP_LAYOUT[node.id]);
  const mapEdges = [];
  const seen = new Set();

  for (const node of mapNodes) {
    for (const nextId of node.neighbors || []) {
      if (!MAP_LAYOUT[nextId]) continue;
      const key = connectionKey(node.id, nextId);
      if (seen.has(key)) continue;
      seen.add(key);
      mapEdges.push([node.id, nextId]);
    }
  }

  return (
    <div className="panel world-map">
      <div className="world-header">
        <div>
          <h2>{area.name}</h2>
          <p className="world-subtitle">{area.type.toUpperCase()} ZONE</p>
          <p className="world-subtitle">
            Area Difficulty: {area.dangerLevel}/5 | Map Difficulty: {mapPreset?.difficulty || 'Normal'}
          </p>
        </div>
        {area.canEncounter && <button onClick={onWalk}>Walk / Trigger Encounter</button>}
        <button onClick={() => setGlobalMapOpen(true)}>Mapa Geral</button>
      </div>

      {globalMapOpen && (
        <div className="world-map-modal">
          <div className="panel world-map-modal-content">
            <div className="world-map-modal-head">
              <h3>Mapa Geral</h3>
              <button onClick={() => setGlobalMapOpen(false)}>X</button>
            </div>
            <div className="expressive-map">
              <div className="map-backdrop" />
              <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                {mapEdges.map(([fromId, toId]) => {
                  const from = MAP_LAYOUT[fromId];
                  const to = MAP_LAYOUT[toId];
                  return (
                    <line
                      key={`${fromId}-${toId}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      className={`map-edge ${fromId === currentAreaId || toId === currentAreaId ? 'map-edge-active' : ''}`}
                    />
                  );
                })}
              </svg>

              {mapNodes.map((node) => {
                const pos = MAP_LAYOUT[node.id];
                const isCurrent = node.id === currentAreaId;
                const isReachable = connectedIds.has(node.id);
                const missingRequires = (node.requires || []).filter((flag) => !(world?.flags || []).includes(flag));
                const isLocked = missingRequires.length > 0;
                return (
                  <button
                    key={node.id}
                    className={`map-node ${TYPE_CLASS[node.type] || ''} ${isCurrent ? 'current' : ''} ${isReachable ? 'reachable' : ''} ${questTargetAreaId === node.id ? 'quest-target' : ''} ${isLocked ? 'map-node-locked' : ''}`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      borderColor: areaColor(node.type),
                    }}
                    title={`${node.name}${isCurrent ? ' (Current)' : ''}${isLocked ? ` | Requer: ${missingRequires[0]}` : ''}`}
                    disabled={isLocked}
                    onClick={() => {
                      if (isCurrent) return;
                      if (isLocked) return;
                      if (onTeleport) {
                        onTeleport(node.id);
                        return;
                      }
                      if (isReachable) onTravel(node.id);
                    }}
                  >
                    <span className="map-node-dot" style={{ background: areaColor(node.type) }} />
                    <span className="map-node-label">{node.name}</span>
                    {isLocked && <span className="map-lock-tag">{missingRequires[0]}</span>}
                    {isCurrent && <span className="player-pin">YOU</span>}
                  </button>
                );
              })}
            </div>
            <div className="map-legend">
              <span className="map-legend-title">Navegacao</span>
              <span className="map-legend-chip"><strong>Clique</strong> no ponto para TP</span>
              <span className="map-legend-chip"><strong>X</strong> fecha o mapa</span>
              <span className="map-legend-chip">Amarelo = area atual</span>
              <span className="map-legend-chip">Borda clara = area desbloqueada</span>
              <span className="map-legend-chip">Tag = requisito pendente</span>
            </div>
          </div>
        </div>
      )}

      {mapData && (
        <div className="open-map-section">
          <h3>Open Area (Directional Movement)</h3>
          <p className="world-subtitle">Use Arrow Keys / WASD ou D-pad. Enter/E para interagir com NPC.</p>

          <div
            className="tile-map"
            style={{
              gridTemplateColumns: `repeat(${mapData.width}, 1fr)`,
            }}
          >
            {mapData.tiles.flatMap((row, y) =>
              row.split('').map((tile, x) => {
                const isPlayer = world?.playerPos?.x === x && world?.playerPos?.y === y;
                const npc = npcs.find((entry) => entry.x === x && entry.y === y);
                const npcMarker = npc ? npcQuestMarkers[npc.id] : null;
                const isTargetNpc = !!npc && npc.id === targetNpcId && currentAreaId === targetNpcAreaId;
                const isTargetTile = targetNpcPos
                  && currentAreaId === targetNpcAreaId
                  && targetNpcPos.x === x
                  && targetNpcPos.y === y;
                const classByTile = TILE_CLASS[tile] || 'tile-path';
                const tileSymbol = TILE_SYMBOL[tile] || '';
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`tile ${classByTile} ${isPlayer ? 'tile-player' : ''} ${npc ? 'tile-npc' : ''} ${isTargetTile ? 'tile-quest-goal' : ''}`}
                    title={`(${x},${y})`}
                  >
                    {isPlayer ? (
                      <span className={`player-sprite facing-${world?.playerFacing || 'down'} frame-${world?.playerFrame || 0} walking`} />
                    ) : npc ? (
                      <span className={`npc-sprite frame-${npcFrame} ${isTargetNpc ? 'npc-sprite-target' : ''}`} title={npc.name}>
                        N
                        {npcMarker === 'available' && <span className="npc-quest-marker available">!</span>}
                        {npcMarker === 'turnin' && <span className="npc-quest-marker turnin">?</span>}
                        {isTargetNpc && <span className="npc-quest-marker focus">★</span>}
                      </span>
                    ) : tileSymbol ? (
                      <span className="tile-symbol">{tileSymbol}</span>
                    ) : ''}
                  </div>
                );
              })
            )}
          </div>

          <div className="dpad">
            <button onClick={onInteractNpc}>Talk</button>
            <button onClick={() => onMove('up')}>↑</button>
            <div className="dpad-mid">
              <button onClick={() => onMove('left')}>←</button>
              <button onClick={() => onMove('down')}>↓</button>
              <button onClick={() => onMove('right')}>→</button>
            </div>
          </div>
        </div>
      )}

      {npcs.length > 0 && (
        <>
          <h3>NPCs</h3>
          <div className="mini-grid">
            {npcs.map((npc) => {
              const marker = npcQuestMarkers[npc.id];
              const markerText = marker === 'available' ? '! quest nova' : marker === 'turnin' ? '? entregar' : '';
              const isTargetNpc = npc.id === targetNpcId;
              return (
                <span key={npc.id} className={`list-row ${isTargetNpc ? 'list-row-focus' : ''}`}>
                  <span>
                    <strong>{npc.name}</strong>
                    <br />
                    Posicao: ({npc.x}, {npc.y}) {markerText}
                    {isTargetNpc ? ' | alvo atual' : ''}
                  </span>
                </span>
              );
            })}
          </div>
          {targetNpcId && (
            <p className="world-subtitle">
              Proximo contato: <strong>{targetNpcName || targetNpcId}</strong>. Procure o icone <strong>★</strong> no mapa.
            </p>
          )}
        </>
      )}

      {!!Object.keys(quests?.active || {}).length && (
        <>
          <h3>Active Quests</h3>
          <div className="mini-grid">
            {Object.keys(quests.active).map((questId) => (
              <span key={questId} className="list-row">{QUESTS[questId]?.name || questId}</span>
            ))}
          </div>
        </>
      )}

      <div className="mini-grid">
        <span className="list-row">Yellow: Town</span>
        <span className="list-row">Green: Route / Forest</span>
        <span className="list-row">Gray: Cave</span>
        <span className="list-row">Blue: Center</span>
        <span className="list-row">Orange: Shop</span>
        <span className="list-row">Purple: Gym</span>
      </div>

      <div className="mini-grid">
        <span className="list-row">Dark Green: Tall Grass (encounters)</span>
        <span className="list-row">Blue: Water (blocked)</span>
        <span className="list-row">Trees / Walls: blocked</span>
        <span className="list-row">BOSS: tile B inicia luta do chefe</span>
        <span className="list-row">TRN: tile N inicia luta de treinador</span>
      </div>

      <h3>Travel</h3>
      <div className="mini-grid">
        {neighbors.map((next) => (
          <button key={next.id} onClick={() => onTravel(next.id)}>
            {next.name}
          </button>
        ))}
      </div>

      {!!fastTravelOptions.length && (
        <>
          <h3>Fast Travel (Hubs Descobertos)</h3>
          <div className="mini-grid">
            {fastTravelOptions.map((next) => (
              <button key={next.id} onClick={() => onFastTravel(next.id)}>
                {next.name}
              </button>
            ))}
          </div>
        </>
      )}

      {trainers.length > 0 && (
        <>
          <h3>Trainers</h3>
          <div className="mini-grid">
            {trainers.map((trainer) => (
              <button key={trainer.id} onClick={() => onTrainer(trainer.id)}>{trainer.name}</button>
            ))}
          </div>
        </>
      )}

      {area.type === 'gym' && <button onClick={onGym}>Challenge Gym</button>}
    </div>
  );
}
