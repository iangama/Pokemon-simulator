import { QUESTS } from '../../data/quests';

const MAP_LAYOUT = {
  oakwindTown: { x: 30, y: 54 },
  route1: { x: 44, y: 54 },
  sunleafForest: { x: 58, y: 38 },
  route2: { x: 72, y: 54 },
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
  center: 'map-node-center',
  shop: 'map-node-shop',
};

function connectionKey(a, b) {
  return [a, b].sort().join('__');
}

function areaColor(type) {
  if (type === 'town') return '#f6c85a';
  if (type === 'route') return '#7fbf5f';
  if (type === 'forest') return '#2f8f5b';
  if (type === 'gym') return '#b66ce3';
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
  onWalk,
  onTrainer,
  onGym,
  onInteractNpc,
  trainers = [],
  npcs = [],
  quests,
}) {
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
          return (
            <button
              key={node.id}
              className={`map-node ${TYPE_CLASS[node.type] || ''} ${isCurrent ? 'current' : ''} ${isReachable ? 'reachable' : ''}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                borderColor: areaColor(node.type),
              }}
              title={`${node.name}${isCurrent ? ' (Current)' : ''}`}
              onClick={() => {
                if (isCurrent) return;
                if (isReachable) onTravel(node.id);
              }}
            >
              <span className="map-node-dot" style={{ background: areaColor(node.type) }} />
              <span className="map-node-label">{node.name}</span>
              {isCurrent && <span className="player-pin">YOU</span>}
            </button>
          );
        })}
      </div>

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
                const classByTile = tile === '#'
                  ? 'tile-wall'
                  : tile === 'g'
                    ? 'tile-grass'
                    : 'tile-path';
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`tile ${classByTile} ${isPlayer ? 'tile-player' : ''} ${npc ? 'tile-npc' : ''}`}
                    title={`(${x},${y})`}
                  >
                    {isPlayer ? (
                      <span className={`player-sprite facing-${world?.playerFacing || 'down'} frame-${world?.playerFrame || 0} walking`} />
                    ) : npc ? (
                      <span className={`npc-sprite frame-${npcFrame}`} title={npc.name}>N</span>
                    ) : tile === 'E' ? 'X' : tile === 'G' ? 'G' : ''}
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
            {npcs.map((npc) => (
              <span key={npc.id} className="list-row">
                {npc.name}
              </span>
            ))}
          </div>
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
        <span className="list-row">Blue: Center</span>
        <span className="list-row">Orange: Shop</span>
        <span className="list-row">Purple: Gym</span>
      </div>

      <h3>Travel</h3>
      <div className="mini-grid">
        {neighbors.map((next) => (
          <button key={next.id} onClick={() => onTravel(next.id)}>
            {next.name}
          </button>
        ))}
      </div>

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
