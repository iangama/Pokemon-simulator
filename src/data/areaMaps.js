export const AREA_MAPS = {
  oakwindTown: {
    width: 20,
    height: 12,
    spawn: { x: 10, y: 6 },
    tiles: [
      '####################',
      '#...............E..#',
      '#....######........#',
      '#....#....#........#',
      '#....#....#........#',
      '#....######....S...#',
      '#.........P........#',
      '#..................#',
      '#..C...............#',
      '#..............G...#',
      '#..................#',
      '####################',
    ],
    exits: [
      { x: 16, y: 1, to: 'route1', spawn: { x: 1, y: 6 } },
      { x: 3, y: 8, to: 'pokemonCenter', spawn: { x: 10, y: 6 } },
      { x: 16, y: 5, to: 'itemShop', spawn: { x: 10, y: 6 } },
      { x: 15, y: 9, to: 'verdantGym', spawn: { x: 2, y: 6 } },
    ],
  },
  route1: {
    width: 20,
    height: 12,
    spawn: { x: 1, y: 6 },
    tiles: [
      '####################',
      '#ggggggg....ggggggg#',
      '#gg....g....g....gg#',
      '#gg....g....g....gg#',
      '#gg....g....g....gg#',
      '#.................g#',
      'E.................F#',
      '#g.................#',
      '#gg....g....g....gg#',
      '#gg....g....g....gg#',
      '#ggggggg....ggggggg#',
      '####################',
    ],
    exits: [
      { x: 0, y: 6, to: 'oakwindTown', spawn: { x: 15, y: 1 } },
      { x: 19, y: 6, to: 'sunleafForest', spawn: { x: 1, y: 6 } },
    ],
  },
  sunleafForest: {
    width: 20,
    height: 12,
    spawn: { x: 1, y: 6 },
    tiles: [
      '####################',
      '#gggggggggggggggggg#',
      '#g....###gg###....g#',
      '#g....#gggggg#....g#',
      '#g....#gggggg#....g#',
      '#g....###..###....g#',
      'R..........g.......T',
      '#g....###..###....g#',
      '#g....#gggggg#....g#',
      '#g....#gggggg#....g#',
      '#gggggggggggggggggg#',
      '####################',
    ],
    exits: [
      { x: 0, y: 6, to: 'route1', spawn: { x: 18, y: 6 } },
      { x: 19, y: 6, to: 'route2', spawn: { x: 1, y: 6 } },
    ],
  },
  route2: {
    width: 20,
    height: 12,
    spawn: { x: 1, y: 6 },
    tiles: [
      '####################',
      '#gggggg...ggggggggg#',
      '#g....g...g....g...#',
      '#g....g...g....g...#',
      '#g....g...g....g...#',
      '#..................#',
      'R...............G..#',
      '#..................#',
      '#...g....g...g....g#',
      '#...g....g...g....g#',
      '#gggggg...ggggggggg#',
      '####################',
    ],
    exits: [
      { x: 0, y: 6, to: 'sunleafForest', spawn: { x: 18, y: 6 } },
      { x: 16, y: 6, to: 'verdantGym', spawn: { x: 2, y: 6 } },
    ],
  },
  pokemonCenter: {
    width: 14,
    height: 9,
    spawn: { x: 10, y: 6 },
    tiles: [
      '##############',
      '#............#',
      '#....####....#',
      '#....#..#....#',
      '#....#..#....#',
      '#....####....#',
      '#.........E..#',
      '#............#',
      '##############',
    ],
    exits: [{ x: 10, y: 6, to: 'oakwindTown', spawn: { x: 3, y: 8 } }],
  },
  itemShop: {
    width: 14,
    height: 9,
    spawn: { x: 10, y: 6 },
    tiles: [
      '##############',
      '#............#',
      '#....####....#',
      '#....#$$#....#',
      '#....#$$#....#',
      '#....####....#',
      '#.........E..#',
      '#............#',
      '##############',
    ],
    exits: [{ x: 10, y: 6, to: 'oakwindTown', spawn: { x: 16, y: 5 } }],
  },
  verdantGym: {
    width: 16,
    height: 10,
    spawn: { x: 2, y: 6 },
    tiles: [
      '################',
      '#..............#',
      '#....######....#',
      '#....#....#....#',
      '#....#....#....#',
      '#....#....#....#',
      '#.E..######..L.#',
      '#..............#',
      '#..............#',
      '################',
    ],
    exits: [
      { x: 2, y: 6, to: 'oakwindTown', spawn: { x: 15, y: 9 } },
      { x: 13, y: 6, to: 'route2', spawn: { x: 16, y: 6 } },
    ],
  },
};

export const MAP_PRESETS = [
  {
    id: 'classic',
    name: 'Classic Plains',
    description: 'Balanceado e aberto.',
    difficulty: 'Normal',
    difficultyTier: 2,
    levelModifier: 0,
    encounterRate: 0.16,
  },
  {
    id: 'wild',
    name: 'Wild Frontier',
    description: 'Mais grama e encontros.',
    difficulty: 'Hard',
    difficultyTier: 3,
    levelModifier: 1,
    encounterRate: 0.24,
  },
  {
    id: 'roads',
    name: 'Road Runner',
    description: 'Rotas mais lineares e rapidas.',
    difficulty: 'Easy',
    difficultyTier: 1,
    levelModifier: -1,
    encounterRate: 0.1,
  },
];

export function getMapPresetById(id) {
  return MAP_PRESETS.find((preset) => preset.id === id) || MAP_PRESETS[0];
}

export function getTileAt(areaId, x, y) {
  const map = AREA_MAPS[areaId];
  if (!map) return '#';
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return '#';
  return map.tiles[y][x] || '#';
}

export function findExit(areaId, x, y) {
  const map = AREA_MAPS[areaId];
  if (!map) return null;
  return map.exits.find((exit) => exit.x === x && exit.y === y) || null;
}
