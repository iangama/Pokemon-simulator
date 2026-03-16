export const WEATHER_BY_DAY = ['clear', 'windy', 'rainy', 'mist', 'storm'];

export const DAILY_WORLD_EVENTS = [
  {
    id: 'calm-day',
    name: 'Dia Calmo',
    description: 'Lojas oferecem um desconto leve em consumiveis.',
    shopDiscount: 0.9,
  },
  {
    id: 'storm-watch',
    name: 'Clima Eletrico',
    description: 'Pokemon eletricos aparecem com mais frequencia.',
    encounterBoostType: 'electric',
  },
  {
    id: 'fisher-festival',
    name: 'Festival de Pesca',
    description: 'Pesca gera mais encontros raros hoje.',
    fishingRareBoost: 0.12,
  },
  {
    id: 'market-day',
    name: 'Mercado Itinerante',
    description: 'Novas trocas de NPC ficam disponiveis.',
    unlockExtraTrade: true,
  },
];

export const CRAFTING_RECIPES = [
  {
    id: 'craft-pokeball',
    name: 'Criar Poke Ball',
    cost: { apricorn: 2, scrapMetal: 1 },
    output: { pokeball: 2 },
  },
  {
    id: 'craft-super-potion',
    name: 'Criar Super Potion',
    cost: { herbBundle: 2, potion: 1 },
    output: { superPotion: 1 },
  },
  {
    id: 'craft-revive',
    name: 'Criar Revive',
    cost: { crystalDust: 2, herbBundle: 2 },
    output: { revive: 1 },
  },
];

export const NPC_TRADE_OFFERS = [
  {
    id: 'trade-oakwind-rattata',
    name: 'Troca de Oakwind',
    npc: 'Merchant Theo',
    location: 'oakwindTown',
    wants: 'rattata',
    gives: 'pikachu',
    minLevel: 5,
    once: true,
  },
  {
    id: 'trade-coast-wingull',
    name: 'Troca da Costa',
    npc: 'Sailor Bren',
    location: 'mistvaleTown',
    wants: 'wingull',
    gives: 'growlithe',
    minLevel: 12,
    once: true,
  },
];

export const AREA_BOSSES = {
  route1: {
    id: 'boss-route1-moltres',
    name: 'Moltres Prime',
    species: 'moltres',
    level: 11,
    rewardMoney: 1300,
    rewardItems: { superPotion: 1, pokeball: 5 },
  },
  sunleafForest: {
    id: 'boss-sunleaf-zapdos',
    name: 'Zapdos Prime',
    species: 'zapdos',
    level: 14,
    rewardMoney: 1700,
    rewardItems: { superPotion: 2, pokeball: 4 },
    unlockFlag: 'FIRST_ROUTE_CLEAR',
  },
  route2: {
    id: 'boss-route2-articuno',
    name: 'Articuno Prime',
    species: 'articuno',
    level: 17,
    rewardMoney: 2200,
    rewardItems: { superPotion: 2, revive: 1 },
    unlockFlag: 'FIRST_ROUTE_CLEAR',
  },
  azureCoast: {
    id: 'boss-azure-suicune',
    name: 'Suicune Prime',
    species: 'suicune',
    level: 22,
    rewardMoney: 3000,
    rewardItems: { revive: 1, superPotion: 3 },
    unlockFlag: 'MIST_COAST_PASS',
  },
  emberCave: {
    id: 'boss-ember-entei',
    name: 'Entei Prime',
    species: 'entei',
    level: 25,
    rewardMoney: 3600,
    rewardItems: { revive: 1, superPotion: 3 },
    unlockFlag: 'MIST_COAST_PASS',
  },
  coralReef: {
    id: 'boss-coral-raikou',
    name: 'Raikou Prime',
    species: 'raikou',
    level: 28,
    rewardMoney: 4300,
    rewardItems: { revive: 1, superPotion: 4 },
    unlockFlag: 'MIST_COAST_PASS',
  },
  crystalLake: {
    id: 'boss-crystal-regice',
    name: 'Regice Prime',
    species: 'regice',
    level: 32,
    rewardMoney: 5200,
    rewardItems: { revive: 2, superPotion: 4 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  thunderPlateau: {
    id: 'boss-thunder-registeel',
    name: 'Registeel Prime',
    species: 'registeel',
    level: 35,
    rewardMoney: 6100,
    rewardItems: { revive: 2, superPotion: 4 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  glacierCavern: {
    id: 'boss-glacier-regirock',
    name: 'Regirock Prime',
    species: 'regirock',
    level: 38,
    rewardMoney: 7000,
    rewardItems: { revive: 2, pokeball: 8 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  cinderTrail: {
    id: 'boss-cinder-heatran',
    name: 'Heatran Prime',
    species: 'heatran',
    level: 42,
    rewardMoney: 8200,
    rewardItems: { revive: 2, pokeball: 10 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  obsidianRidge: {
    id: 'boss-obsidian-giratina',
    name: 'Giratina Prime',
    species: 'giratina-altered',
    level: 46,
    rewardMoney: 9600,
    rewardItems: { revive: 3, pokeball: 10 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  ashenRuins: {
    id: 'boss-ashen-darkrai',
    name: 'Darkrai Prime',
    species: 'darkrai',
    level: 49,
    rewardMoney: 10900,
    rewardItems: { revive: 3, pokeball: 12 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  galeCliffs: {
    id: 'boss-gale-latios',
    name: 'Latios Prime',
    species: 'latios',
    level: 53,
    rewardMoney: 12400,
    rewardItems: { superPotion: 6, revive: 3, pokeball: 12 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  tempestBay: {
    id: 'boss-tempest-latias',
    name: 'Latias Prime',
    species: 'latias',
    level: 56,
    rewardMoney: 13900,
    rewardItems: { superPotion: 7, revive: 3, pokeball: 14 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
  starfallSanctum: {
    id: 'boss-starfall-cresselia',
    name: 'Cresselia Prime',
    species: 'cresselia',
    level: 60,
    rewardMoney: 15800,
    rewardItems: { superPotion: 8, revive: 4, pokeball: 16 },
    unlockFlag: 'EMBER_RANGE_PASS',
  },
};

export const FISHING_TABLES = {
  route1: {
    oldRod: [
      { species: 'magikarp', weight: 70, minLevel: 2, maxLevel: 5 },
      { species: 'goldeen', weight: 30, minLevel: 3, maxLevel: 5 },
    ],
    goodRod: [
      { species: 'poliwag', weight: 40, minLevel: 5, maxLevel: 8 },
      { species: 'staryu', weight: 30, minLevel: 6, maxLevel: 9 },
      { species: 'tentacool', weight: 30, minLevel: 5, maxLevel: 8 },
    ],
  },
  azureCoast: {
    oldRod: [
      { species: 'magikarp', weight: 40, minLevel: 10, maxLevel: 13 },
      { species: 'wingull', weight: 20, minLevel: 10, maxLevel: 12 },
      { species: 'poliwag', weight: 40, minLevel: 10, maxLevel: 13 },
    ],
    goodRod: [
      { species: 'carvanha', weight: 30, minLevel: 14, maxLevel: 17 },
      { species: 'staryu', weight: 25, minLevel: 13, maxLevel: 16 },
      { species: 'lapras', weight: 10, minLevel: 16, maxLevel: 18 },
      { species: 'tentacruel', weight: 35, minLevel: 15, maxLevel: 17 },
    ],
  },
  tempestBay: {
    oldRod: [
      { species: 'chinchou', weight: 35, minLevel: 44, maxLevel: 48 },
      { species: 'sealeo', weight: 25, minLevel: 45, maxLevel: 49 },
      { species: 'tentacruel', weight: 40, minLevel: 45, maxLevel: 50 },
    ],
    goodRod: [
      { species: 'kingdra', weight: 30, minLevel: 48, maxLevel: 52 },
      { species: 'milotic', weight: 20, minLevel: 49, maxLevel: 53 },
      { species: 'walrein', weight: 25, minLevel: 49, maxLevel: 53 },
      { species: 'gyarados', weight: 25, minLevel: 48, maxLevel: 52 },
    ],
  },
};

export const TUTORIAL_TIPS = {
  firstCapture: 'Dica: enfraqueca o Pokemon antes de usar Pokebola.',
  firstShopBuy: 'Dica: estoque de itens muda por dia. Vale checar sempre.',
  firstCraft: 'Dica: crafting transforma materiais em itens de batalha.',
  firstFish: 'Dica: use vara em areas com agua para capturar Pokemon raros.',
  firstTower: 'Dica: a Battle Tower escala dificuldade a cada vitoria.',
};

export const LEGEND_TOWER_FLOORS = [
  { floor: 1, species: 'articuno', level: 58, rewardMoney: 4200 },
  { floor: 2, species: 'zapdos', level: 59, rewardMoney: 4400 },
  { floor: 3, species: 'moltres', level: 60, rewardMoney: 4600 },
  { floor: 4, species: 'mewtwo', level: 61, rewardMoney: 5000 },
  { floor: 5, species: 'mew', level: 62, rewardMoney: 5400 },
  { floor: 6, species: 'raikou', level: 63, rewardMoney: 5800 },
  { floor: 7, species: 'entei', level: 64, rewardMoney: 6200 },
  { floor: 8, species: 'suicune', level: 65, rewardMoney: 6600 },
  { floor: 9, species: 'lugia', level: 66, rewardMoney: 7000 },
  { floor: 10, species: 'ho-oh', level: 67, rewardMoney: 7600 },
  { floor: 11, species: 'regirock', level: 68, rewardMoney: 8200 },
  { floor: 12, species: 'regice', level: 69, rewardMoney: 8800 },
  { floor: 13, species: 'registeel', level: 70, rewardMoney: 9400 },
  { floor: 14, species: 'latias', level: 71, rewardMoney: 10000 },
  { floor: 15, species: 'latios', level: 72, rewardMoney: 10800 },
  { floor: 16, species: 'kyogre', level: 73, rewardMoney: 11600 },
  { floor: 17, species: 'groudon', level: 74, rewardMoney: 12400 },
  { floor: 18, species: 'rayquaza', level: 75, rewardMoney: 13200 },
  { floor: 19, species: 'dialga', level: 76, rewardMoney: 14000 },
  { floor: 20, species: 'palkia', level: 77, rewardMoney: 14800 },
  { floor: 21, species: 'giratina-altered', level: 78, rewardMoney: 15600 },
  { floor: 22, species: 'darkrai', level: 79, rewardMoney: 16400 },
  { floor: 23, species: 'reshiram', level: 80, rewardMoney: 17200 },
  { floor: 24, species: 'zekrom', level: 81, rewardMoney: 18000 },
  { floor: 25, species: 'kyurem', level: 82, rewardMoney: 19000 },
];

export const QUEST_PATH_CHOICES = [
  {
    id: 'balanced',
    name: 'Caminho Balanceado',
    description: 'Equilibrio entre captura e combate.',
    rewardsMod: { money: 1, encounterRate: 1.15 },
  },
  {
    id: 'collector',
    name: 'Caminho Colecionador',
    description: 'Mais foco em captura e Pokedex.',
    rewardsMod: { money: 0.9, encounterRate: 1.1 },
  },
  {
    id: 'fighter',
    name: 'Caminho Lutador',
    description: 'Mais foco em batalha e dinheiro.',
    rewardsMod: { money: 1.15, encounterRate: 0.95 },
  },
];
