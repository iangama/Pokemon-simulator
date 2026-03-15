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
  sunleafForest: {
    id: 'boss-sunleaf',
    name: 'Alpha Pinsir',
    species: 'pinsir',
    level: 12,
    rewardMoney: 1200,
    rewardItems: { superPotion: 2, pokeball: 4 },
    unlockFlag: 'FIRST_ROUTE_CLEAR',
  },
  azureCoast: {
    id: 'boss-azure',
    name: 'Alpha Gyarados',
    species: 'gyarados',
    level: 20,
    rewardMoney: 2600,
    rewardItems: { revive: 1, superPotion: 3 },
    unlockFlag: 'MIST_COAST_PASS',
  },
  ironpeakPass: {
    id: 'boss-ironpeak',
    name: 'Alpha Tyranitar',
    species: 'tyranitar',
    level: 28,
    rewardMoney: 4200,
    rewardItems: { revive: 2, superPotion: 4 },
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
};

export const TUTORIAL_TIPS = {
  firstCapture: 'Dica: enfraqueca o Pokemon antes de usar Pokebola.',
  firstShopBuy: 'Dica: estoque de itens muda por dia. Vale checar sempre.',
  firstCraft: 'Dica: crafting transforma materiais em itens de batalha.',
  firstFish: 'Dica: use vara em areas com agua para capturar Pokemon raros.',
  firstTower: 'Dica: a Battle Tower escala dificuldade a cada vitoria.',
};

export const QUEST_PATH_CHOICES = [
  {
    id: 'balanced',
    name: 'Caminho Balanceado',
    description: 'Equilibrio entre captura e combate.',
    rewardsMod: { money: 1, encounterRate: 1 },
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
