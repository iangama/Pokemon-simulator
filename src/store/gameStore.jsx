import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { SCREENS, STARTING_MONEY } from '../utils/constants';
import { createInitialInventory, consumeItem, addItem } from '../domain/inventory/inventoryModel';
import { createPokedex, markCaught, markSeen } from '../domain/pokedex/pokedexModel';
import { addPokemonToTeam, canAddToTeam, healTeam, replaceTeamMember } from '../domain/team/teamModel';
import { addPokemonToStorage, moveFromStorageToTeam, moveFromTeamToStorage } from '../domain/team/storageModel';
import { applyItemToPokemon } from '../domain/inventory/itemEffects';
import { spendMoney } from '../domain/progression/moneyModel';
import { addBadge } from '../domain/progression/badgeModel';
import { applyXp } from '../domain/progression/levelModel';
import { calculateCaptureChance } from '../domain/capture/captureCalculator';
import { fetchPokemonByNameOrId, fetchPokemonSpecies, fetchEvolutionChainByUrl, fetchMoveByNameOrId } from '../api/pokeapi';
import { searchTcgCards } from '../api/tcgApi';
import { tcgdexListSets } from '../api/tcgdexApi';
import { createPokemonEntity } from '../domain/pokemon/pokemonFactory';
import { enrichMovesWithDetails } from '../domain/pokemon/pokemonMoves';
import { getEvolutionReadiness } from '../domain/pokemon/pokemonEvolution';
import { getNewLevelUpMoves, toLearnableMove } from '../domain/pokemon/pokemonLearnset';
import { xpToLevel } from '../domain/pokemon/pokemonGrowth';
import { rollEncounter } from '../engine/encounterEngine';
import { startWildBattle, startTrainerBattle, runBattleTurn } from '../engine/battleEngine';
import { selectBestMove, shouldAiSwitch } from '../engine/aiEngine';
import { applyBattleRewards } from '../engine/progressionEngine';
import { canTravel } from '../engine/navigationEngine';
import { saveGame, loadGame, listSaveSlots, exportSave, importSave } from '../engine/saveEngine';
import { STARTERS } from '../data/starters';
import { AREAS } from '../data/areas';
import { TRAINERS } from '../data/trainers';
import { GYMS } from '../data/gyms';
import { ITEMS } from '../data/items';
import { SHOP_CATALOG } from '../data/shopCatalog';
import { EXPEDITIONS } from '../data/expeditions';
import { AREA_MAPS, MAP_PRESETS, getMapPresetById, getTileAt, findExit } from '../data/areaMaps';
import { getItemEvolutionsForSpecies } from '../data/evolutionItems';
import { QUESTS, WORLD_NPCS } from '../data/quests';
import {
  AREA_BOSSES,
  CRAFTING_RECIPES,
  DAILY_WORLD_EVENTS,
  FISHING_TABLES,
  QUEST_PATH_CHOICES,
  TUTORIAL_TIPS,
  WEATHER_BY_DAY,
  NPC_TRADE_OFFERS,
} from '../data/worldSystems';
import {
  createQuestState,
  normalizeQuestState,
  resolveQuestEvent,
  trackQuest as trackQuestState,
  getTrackedQuestGuidance,
  getQuestByFlagUnlock,
} from '../engine/questEngine';
import {
  createAchievementState,
  normalizeAchievementState,
  resolveAchievementEvent,
} from '../engine/achievementEngine';
import { pickWeighted, randomInt } from '../utils/random';

const GameContext = createContext(null);

const initialState = {
  screen: SCREENS.TITLE,
  loading: false,
  error: null,
  saveStatus: 'idle',
  activeSaveSlot: 1,
  saveSlots: [],
  playerName: '',
  world: {
    areaId: 'oakwindTown',
    mapPreset: 'classic',
    playerPos: { x: 10, y: 6 },
    playerFacing: 'down',
    playerFrame: 0,
    stepsInArea: 0,
    flags: [],
    defeatedTrainers: {},
    gymsDefeated: {},
    npcFlags: {},
    discoveredAreas: ['oakwindTown'],
  },
  team: [],
  storage: [],
  inventory: createInitialInventory(),
  money: STARTING_MONEY,
  pokedex: createPokedex(),
  badges: [],
  battle: null,
  settings: {
    textSpeed: 'normal',
    sfx: true,
  },
  pendingLevelUp: null,
  pendingEvolution: null,
  pendingMoveLearn: null,
  battleSummary: null,
  captureSummary: null,
  importStatus: null,
  quests: createQuestState(),
  questToast: null,
  questPopup: null,
  reputation: {
    oakwind: 0,
    mistCoast: 0,
    ironpeak: 0,
  },
  achievements: createAchievementState(),
  achievementToast: null,
  worldSystems: {
    dayKey: null,
    weather: 'clear',
    timeOfDay: 'day',
    dailyEventId: null,
    shopStock: [...SHOP_CATALOG],
    bossesDefeated: {},
    tutorialTipsSeen: {},
    pathChoice: 'balanced',
    pathChoiceSelected: false,
    tradeCompleted: {},
    tower: { streak: 0, bestStreak: 0, rank: 'Bronze' },
  },
  daycare: {
    slots: [],
    eggs: [],
    steps: 0,
  },
  profile: {
    codexViewedNpcs: {},
  },
  expeditions: {
    progress: {},
    completed: {},
    log: [],
  },
  tcg: {
    collection: {},
    sets: [],
    lastRewardAt: null,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };
    case 'PATCH':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

async function fetchPokemonWithMoves(species, level, owner = 'player') {
  const pokemonData = await fetchPokemonByNameOrId(species);
  const speciesData = await fetchPokemonSpecies(species);
  let entity = createPokemonEntity({ pokemonData, speciesData, level, owner });

  const moveDetailsBySlug = {};
  await Promise.all(
    entity.moves.map(async (move) => {
      const detail = await fetchMoveByNameOrId(move.slug);
      moveDetailsBySlug[move.slug] = detail;
    })
  );

  entity = {
    ...entity,
    moves: enrichMovesWithDetails(entity.moves, moveDetailsBySlug),
  };
  return entity;
}

function ensureMinimumInventory(inventory = {}) {
  return {
    ...inventory,
    pokeball: Math.max(10, inventory.pokeball || 0),
    potion: Math.max(12, inventory.potion || 0),
    superPotion: Math.max(4, inventory.superPotion || 0),
    revive: Math.max(3, inventory.revive || 0),
    antidote: Math.max(3, inventory.antidote || 0),
    fireStone: Math.max(0, inventory.fireStone || 0),
    waterStone: Math.max(0, inventory.waterStone || 0),
    thunderStone: Math.max(0, inventory.thunderStone || 0),
    leafStone: Math.max(0, inventory.leafStone || 0),
    moonStone: Math.max(0, inventory.moonStone || 0),
    oldRod: Math.max(1, inventory.oldRod || 0),
    goodRod: Math.max(0, inventory.goodRod || 0),
    apricorn: Math.max(4, inventory.apricorn || 0),
    scrapMetal: Math.max(3, inventory.scrapMetal || 0),
    herbBundle: Math.max(3, inventory.herbBundle || 0),
    crystalDust: Math.max(1, inventory.crystalDust || 0),
  };
}

function normalizePokemonForBattle(pokemon) {
  const stats = pokemon?.stats || {};
  const normalizedStats = {
    hp: Number.isFinite(stats.hp) ? stats.hp : 20,
    attack: Number.isFinite(stats.attack) ? stats.attack : 10,
    defense: Number.isFinite(stats.defense) ? stats.defense : 10,
    speed: Number.isFinite(stats.speed) ? stats.speed : 10,
    specialAttack: Number.isFinite(stats.specialAttack) ? stats.specialAttack : (Number.isFinite(stats.attack) ? stats.attack : 10),
    specialDefense: Number.isFinite(stats.specialDefense) ? stats.specialDefense : (Number.isFinite(stats.defense) ? stats.defense : 10),
  };
  const hp = Number.isFinite(pokemon?.currentHp) ? pokemon.currentHp : normalizedStats.hp;

  return {
    ...pokemon,
    stats: normalizedStats,
    moves: (pokemon.moves || []).map((move) => ({
      ...move,
      pp: Number.isFinite(move.pp) ? move.pp : 20,
      currentPp: Number.isFinite(move.currentPp) ? move.currentPp : (Number.isFinite(move.pp) ? move.pp : 20),
    })),
    currentHp: hp,
    fainted: hp <= 0,
    status: pokemon.status || null,
    knownMoveSlugs: (pokemon.knownMoveSlugs || pokemon.moves?.map((move) => move.slug) || []),
  };
}

function firstExistingSlot() {
  const slots = listSaveSlots();
  const found = slots.find((slot) => slot.exists);
  return { slots, slot: found?.slot || 1 };
}

function tileHasNpc(areaId, x, y) {
  const npcs = WORLD_NPCS[areaId] || [];
  return npcs.find((npc) => npc.x === x && npc.y === y) || null;
}

function isBlockingTile(tile) {
  return ['#', '~', 't', '$'].includes(tile);
}

function isEncounterTile(tile) {
  return tile === 'g' || tile === 'h';
}

function adjustEnemyLevel(baseLevel, mapPresetId) {
  const preset = getMapPresetById(mapPresetId);
  return Math.max(2, Math.min(100, baseLevel + (preset.levelModifier || 0)));
}

function xpRemainingToNextLevel(pokemon) {
  if (!pokemon) return 0;
  const next = xpToLevel((pokemon.level || 1) + 1);
  return Math.max(0, next - (pokemon.currentXp || 0));
}

function struggleMove() {
  return {
    id: 'struggle',
    name: 'Struggle',
    power: 50,
    type: 'normal',
    damageClass: 'physical',
  };
}

function applyQuestRewards({ inventory, money, team }, rewards = {}) {
  let nextInventory = { ...inventory };
  let nextMoney = money + (rewards.money || 0);
  let nextTeam = [...(team || [])];
  for (const [itemId, qty] of Object.entries(rewards.items || {})) {
    nextInventory = addItem(nextInventory, itemId, qty);
  }
  const teamXp = Number(rewards.teamXp || 0);
  const leadXp = Number(rewards.leadXp || 0);
  if (teamXp > 0 && nextTeam.length) {
    nextTeam = nextTeam.map((member) => applyXp(member, teamXp).pokemon);
  }
  if (leadXp > 0 && nextTeam.length) {
    nextTeam[0] = applyXp(nextTeam[0], leadXp).pokemon;
  }
  return { inventory: nextInventory, money: nextMoney, team: nextTeam };
}

function ensureDiscoveredAreas(world = {}) {
  const current = world.areaId || 'oakwindTown';
  const discovered = new Set(world.discoveredAreas || []);
  discovered.add(current);
  return Array.from(discovered);
}

function addReputation(reputation = {}, regionId, amount = 0) {
  if (!regionId || !amount) return reputation;
  return {
    ...reputation,
    [regionId]: Math.max(0, (reputation[regionId] || 0) + amount),
  };
}

function nowKey() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function currentTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'day';
  return 'night';
}

function dailyWorldSnapshot() {
  const dayKey = nowKey();
  const hash = [...dayKey].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const weather = WEATHER_BY_DAY[hash % WEATHER_BY_DAY.length] || 'clear';
  const dailyEvent = DAILY_WORLD_EVENTS[hash % DAILY_WORLD_EVENTS.length] || DAILY_WORLD_EVENTS[0];
  const rotated = [...SHOP_CATALOG].sort((a, b) => ((a.charCodeAt(0) + hash) % 13) - ((b.charCodeAt(0) + hash) % 13));
  const shopStock = rotated.slice(0, Math.min(rotated.length, 10));
  return {
    dayKey,
    weather,
    timeOfDay: currentTimeOfDay(),
    dailyEventId: dailyEvent?.id || null,
    shopStock,
  };
}

function normalizeWorldSystems(raw = {}) {
  const snapshot = dailyWorldSnapshot();
  const next = {
    dayKey: raw.dayKey || snapshot.dayKey,
    weather: raw.weather || snapshot.weather,
    timeOfDay: raw.timeOfDay || snapshot.timeOfDay,
    dailyEventId: raw.dailyEventId || snapshot.dailyEventId,
    shopStock: Array.isArray(raw.shopStock) && raw.shopStock.length ? raw.shopStock : snapshot.shopStock,
    bossesDefeated: { ...(raw.bossesDefeated || {}) },
    tutorialTipsSeen: { ...(raw.tutorialTipsSeen || {}) },
    pathChoice: raw.pathChoice || 'balanced',
    pathChoiceSelected: !!raw.pathChoiceSelected,
    tradeCompleted: { ...(raw.tradeCompleted || {}) },
    tower: {
      streak: Number(raw.tower?.streak || 0),
      bestStreak: Number(raw.tower?.bestStreak || 0),
      rank: raw.tower?.rank || 'Bronze',
    },
  };

  if (next.dayKey !== snapshot.dayKey) {
    next.dayKey = snapshot.dayKey;
    next.weather = snapshot.weather;
    next.timeOfDay = snapshot.timeOfDay;
    next.dailyEventId = snapshot.dailyEventId;
    next.shopStock = snapshot.shopStock;
  } else {
    next.timeOfDay = snapshot.timeOfDay;
  }
  return next;
}

function normalizeDaycare(raw = {}) {
  return {
    slots: Array.isArray(raw.slots) ? raw.slots : [],
    eggs: Array.isArray(raw.eggs) ? raw.eggs : [],
    steps: Number(raw.steps || 0),
  };
}

function normalizeExpeditions(raw = {}) {
  const next = {
    progress: { ...(raw.progress || {}) },
    completed: { ...(raw.completed || {}) },
    log: Array.isArray(raw.log) ? [...raw.log] : [],
  };

  for (const expedition of Object.values(EXPEDITIONS)) {
    const current = Number(next.progress[expedition.id] || 0);
    next.progress[expedition.id] = Math.max(0, Math.min(expedition.phases.length, current));
    if (next.progress[expedition.id] >= expedition.phases.length) {
      next.completed[expedition.id] = true;
      if (!next.log.includes(expedition.id)) next.log.push(expedition.id);
    }
  }
  for (const id of Object.keys(next.completed)) {
    if (!EXPEDITIONS[id]) delete next.completed[id];
  }
  return next;
}

function applyOutsideStatusStep(team = []) {
  if (!team.length) return { team, damaged: false };
  const lead = team[0];
  if (lead?.status !== 'poison') return { team, damaged: false };
  const loss = Math.max(1, Math.floor((lead.stats?.hp || 20) * 0.04));
  const nextLead = {
    ...lead,
    currentHp: Math.max(1, (lead.currentHp || 1) - loss),
    fainted: false,
  };
  const nextTeam = [...team];
  nextTeam[0] = nextLead;
  return { team: nextTeam, damaged: true };
}

function pathChoiceModifier(worldSystems) {
  const found = QUEST_PATH_CHOICES.find((choice) => choice.id === worldSystems?.pathChoice);
  return found?.rewardsMod || { money: 1, encounterRate: 1 };
}

function averageTeamLevel(team = []) {
  if (!team.length) return 1;
  return team.reduce((sum, member) => sum + (member.level || 1), 0) / team.length;
}

function questRecommendedLevel(quest) {
  if (!quest) return 8;
  for (const objective of quest.objectives || []) {
    if (!objective.areaId) continue;
    const area = AREAS[objective.areaId];
    if (!area) continue;
    if (area.minLevel && area.maxLevel) return Math.floor((area.minLevel + area.maxLevel) / 2);
    if (area.maxLevel) return area.maxLevel;
    if (area.minLevel) return area.minLevel;
  }
  if (quest.turnInAreaId && AREAS[quest.turnInAreaId]?.maxLevel) {
    return AREAS[quest.turnInAreaId].maxLevel;
  }
  return 8;
}

function scaleQuestXp({ rewards = {}, quest, team = [] }) {
  const hasQuestXp = Number(rewards.teamXp || 0) > 0 || Number(rewards.leadXp || 0) > 0;
  if (!hasQuestXp) return rewards;

  const avgLevel = averageTeamLevel(team);
  const recommended = questRecommendedLevel(quest);
  const ratio = recommended / Math.max(1, avgLevel);
  const levelScale = Math.max(0.6, Math.min(1.6, Math.pow(ratio, 0.72)));
  const partyScale = Math.max(0.55, Math.min(1, 4 / Math.max(4, (team.length || 1) * 1.2)));

  const scaledTeamXp = rewards.teamXp
    ? Math.max(20, Math.floor(rewards.teamXp * levelScale * partyScale))
    : 0;
  const scaledLeadXp = rewards.leadXp
    ? Math.max(20, Math.floor(rewards.leadXp * levelScale))
    : 0;

  return {
    ...rewards,
    teamXp: scaledTeamXp || undefined,
    leadXp: scaledLeadXp || undefined,
  };
}

function explorationEncounterModifier(team = []) {
  const lead = team[0];
  const abilities = lead?.abilities || [];
  if (abilities.includes('intimidate') || abilities.includes('keen-eye')) return 0.9;
  if (abilities.includes('static') || abilities.includes('lightning-rod')) return 1.08;
  return 1;
}

function chooseFishingEntry(areaId, rodKind, weather, dailyEvent) {
  const table = FISHING_TABLES[areaId]?.[rodKind] || [];
  if (!table.length) return null;
  const boosted = table.map((entry) => {
    const isRare = entry.weight <= 12;
    const bonus = isRare ? (dailyEvent?.fishingRareBoost || 0) : 0;
    return {
      ...entry,
      weight: Math.max(1, Math.floor(entry.weight * (1 + bonus))),
    };
  });
  const pick = pickWeighted(boosted);
  const weatherBoost = weather === 'rainy' && ['water', 'electric'].some((slug) => pick.species.includes(slug)) ? 1 : 0;
  const level = randomInt(pick.minLevel, pick.maxLevel + weatherBoost);
  return { species: pick.species, level: Math.min(100, level) };
}

function getAreaBossById(bossId) {
  return Object.values(AREA_BOSSES).find((entry) => entry.id === bossId) || null;
}

function rankByStreak(streak = 0) {
  if (streak >= 25) return 'Master';
  if (streak >= 15) return 'Ultra';
  if (streak >= 8) return 'Great';
  return 'Bronze';
}

function advanceDaycare(daycare, team, steps = 1) {
  const next = normalizeDaycare(daycare);
  next.steps += steps;
  let nextTeam = [...team];

  if (next.slots.length > 0 && next.steps % 8 === 0) {
    for (const slot of next.slots) {
      const idx = nextTeam.findIndex((entry) => entry.uid === slot.uid);
      if (idx < 0) continue;
      const member = nextTeam[idx];
      const gain = Math.max(4, Math.floor((member.level || 1) / 2));
      const xpResult = applyXp(member, gain);
      nextTeam[idx] = xpResult.pokemon;
    }
  }

  if (next.slots.length >= 2 && next.steps % 24 === 0 && next.eggs.length < 3) {
    const [a, b] = next.slots;
    next.eggs.push({
      id: `egg-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      species: Math.random() < 0.5 ? a.species : b.species,
      hatchSteps: 12 + Math.floor(Math.random() * 8),
      progress: 0,
    });
  }

  next.eggs = next.eggs.map((egg) => ({ ...egg, progress: egg.progress + steps }));
  const hatchable = next.eggs.filter((egg) => egg.progress >= egg.hatchSteps);
  next.eggs = next.eggs.filter((egg) => egg.progress < egg.hatchSteps);

  return { daycare: next, team: nextTeam, hatchable };
}

function normalizeLoadedState(save = {}) {
  const normalizedWorld = {
    ...(save.world || {}),
    discoveredAreas: ensureDiscoveredAreas(save.world || {}),
  };
  const baseReputation = {
    oakwind: 0,
    mistCoast: 0,
    ironpeak: 0,
  };
  return {
    ...save,
    world: normalizedWorld,
    quests: normalizeQuestState(save.quests),
    reputation: { ...baseReputation, ...(save.reputation || {}) },
    achievements: normalizeAchievementState(save.achievements),
    worldSystems: normalizeWorldSystems(save.worldSystems),
    daycare: normalizeDaycare(save.daycare),
    profile: {
      codexViewedNpcs: { ...(save.profile?.codexViewedNpcs || {}) },
    },
    expeditions: normalizeExpeditions(save.expeditions),
    questToast: null,
    questPopup: null,
    achievementToast: null,
  };
}

function lockMessageForArea(nextAreaId, worldFlags = []) {
  const area = AREAS[nextAreaId];
  if (!area?.requires?.length) return 'Esta area esta bloqueada no momento.';
  const missing = area.requires.filter((flag) => !worldFlags.includes(flag));
  if (!missing.length) return 'Esta area esta bloqueada no momento.';
  const quest = getQuestByFlagUnlock(missing[0]);
  if (quest?.name) {
    return `Voce precisa concluir \"${quest.name}\" para entrar em ${area.name}.`;
  }
  return `Voce precisa liberar ${missing[0]} para entrar em ${area.name}.`;
}

async function withTimeout(promise, ms, fallback = null) {
  let timerId;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timerId = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(() => {
    function syncWorldSystems(currentSystems = state.worldSystems) {
      return normalizeWorldSystems(currentSystems);
    }

    function getDailyEvent(systems = state.worldSystems) {
      return DAILY_WORLD_EVENTS.find((entry) => entry.id === systems?.dailyEventId) || DAILY_WORLD_EVENTS[0] || null;
    }

    function markTutorialTipSeen(systems, tipId) {
      if (!tipId) return systems;
      return {
        ...systems,
        tutorialTipsSeen: {
          ...(systems.tutorialTipsSeen || {}),
          [tipId]: true,
        },
      };
    }

    function resolveQuestRuntime({
      event,
      quests = state.quests,
      world = state.world,
      inventory = state.inventory,
      money = state.money,
      team = state.team,
      reputation = state.reputation,
    }) {
      const resolved = resolveQuestEvent({ quests, event });
      let nextInventory = inventory;
      let nextMoney = money;
      let nextTeam = [...team];
      let nextWorld = { ...world, flags: [...(world.flags || [])] };
      let nextReputation = { ...reputation };
      let popup = null;

      for (const questId of resolved.completedQuestIds) {
        const quest = QUESTS[questId];
        if (!quest) continue;
        const moneyMod = pathChoiceModifier(state.worldSystems).money || 1;
        let adjustedRewards = {
          ...(quest.rewards || {}),
          money: Math.floor((quest.rewards?.money || 0) * moneyMod),
        };
        adjustedRewards = scaleQuestXp({ rewards: adjustedRewards, quest, team: nextTeam });
        const rewarded = applyQuestRewards({ inventory: nextInventory, money: nextMoney, team: nextTeam }, adjustedRewards);
        nextInventory = rewarded.inventory;
        nextMoney = rewarded.money;
        nextTeam = rewarded.team;
        for (const flag of quest.rewards?.flags || []) {
          if (!nextWorld.flags.includes(flag)) nextWorld.flags.push(flag);
        }
        const firstObjectiveArea = quest.objectives?.[0]?.areaId || quest.turnInAreaId || null;
        const regionId = firstObjectiveArea ? AREAS[firstObjectiveArea]?.region : null;
        nextReputation = addReputation(nextReputation, regionId, 4);
        popup = {
          title: `Quest concluida: ${quest.name}`,
          description: quest.description,
          rewards: adjustedRewards,
          nextHint: getTrackedQuestGuidance(resolved.quests)?.hint || null,
        };
      }

      return {
        quests: resolved.quests,
        world: nextWorld,
        inventory: nextInventory,
        money: nextMoney,
        team: nextTeam,
        reputation: nextReputation,
        questToast: resolved.progressToasts.at(-1) || null,
        questPopup: popup,
        completedQuestCount: resolved.completedQuestIds.length,
      };
    }

    return ({
    setScreen(screen) {
      dispatch({ type: 'SET_SCREEN', payload: screen });
    },

    async bootstrap() {
      const { slots, slot } = firstExistingSlot();
      const save = loadGame(slot);
      if (!save) {
        dispatch({ type: 'PATCH', payload: { saveSlots: slots, activeSaveSlot: 1 } });
        return;
      }
      const normalizedSave = normalizeLoadedState(save);
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...normalizedSave,
          worldSystems: syncWorldSystems(normalizedSave.worldSystems),
          activeSaveSlot: slot,
          saveSlots: slots,
          inventory: ensureMinimumInventory(normalizedSave.inventory),
          team: (normalizedSave.team || []).map(normalizePokemonForBattle),
          storage: (normalizedSave.storage || []).map(normalizePokemonForBattle),
        },
      });
      dispatch({ type: 'SET_SCREEN', payload: SCREENS.CONTINUE_GAME });
    },

    async newGame(playerName, starterName, mapPreset = 'classic', slot = state.activeSaveSlot || 1) {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      try {
        const starter = await fetchPokemonWithMoves(starterName, 5, 'player');
        const townSpawn = AREA_MAPS.oakwindTown?.spawn || { x: 10, y: 6 };
        const next = {
          ...initialState,
          playerName,
          activeSaveSlot: slot,
          saveSlots: listSaveSlots(),
          world: {
            ...initialState.world,
            mapPreset,
            playerPos: { ...townSpawn },
            discoveredAreas: ['oakwindTown'],
          },
          team: [starter],
          pokedex: markCaught(markSeen(createPokedex(), starter.species), starter.species),
          quests: createQuestState(),
          questToast: null,
          questPopup: null,
          reputation: {
            oakwind: 0,
            mistCoast: 0,
            ironpeak: 0,
          },
          achievements: createAchievementState(),
          achievementToast: null,
          worldSystems: syncWorldSystems(initialState.worldSystems),
          daycare: normalizeDaycare(initialState.daycare),
          profile: { codexViewedNpcs: {} },
          screen: SCREENS.WORLD,
        };
        dispatch({ type: 'SET_STATE', payload: next });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: String(error.message || error) });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    continueGame() {
      const save = loadGame(state.activeSaveSlot || 1);
      if (!save) return;
      const normalizedSave = normalizeLoadedState(save);
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...normalizedSave,
          worldSystems: syncWorldSystems(normalizedSave.worldSystems),
          activeSaveSlot: state.activeSaveSlot || 1,
          saveSlots: listSaveSlots(),
          inventory: ensureMinimumInventory(normalizedSave.inventory),
          team: (normalizedSave.team || []).map(normalizePokemonForBattle),
          storage: (normalizedSave.storage || []).map(normalizePokemonForBattle),
          screen: SCREENS.WORLD,
        },
      });
    },

    continueFromSlot(slot) {
      const save = loadGame(slot);
      if (!save) return false;
      const normalizedSave = normalizeLoadedState(save);
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...normalizedSave,
          worldSystems: syncWorldSystems(normalizedSave.worldSystems),
          activeSaveSlot: slot,
          saveSlots: listSaveSlots(),
          inventory: ensureMinimumInventory(normalizedSave.inventory),
          team: (normalizedSave.team || []).map(normalizePokemonForBattle),
          storage: (normalizedSave.storage || []).map(normalizePokemonForBattle),
          screen: SCREENS.WORLD,
        },
      });
      return true;
    },

    setActiveSaveSlot(slot) {
      dispatch({ type: 'PATCH', payload: { activeSaveSlot: slot } });
    },

    refreshSaveSlots() {
      dispatch({ type: 'PATCH', payload: { saveSlots: listSaveSlots() } });
    },

    exportCurrentSave() {
      return exportSave(state.activeSaveSlot || 1);
    },

    importSaveToSlot(raw, slot = state.activeSaveSlot || 1) {
      const result = importSave(raw, slot);
      dispatch({
        type: 'PATCH',
        payload: {
          importStatus: result.ok ? `Importado no slot ${slot}.` : `Falha no import: ${result.reason || 'invalido'}`,
          saveSlots: listSaveSlots(),
          activeSaveSlot: slot,
        },
      });
      return result;
    },

    async moveToArea(nextAreaId) {
      if (!canTravel(state.world.areaId, nextAreaId, state.world.flags)) {
        dispatch({ type: 'PATCH', payload: { error: lockMessageForArea(nextAreaId, state.world.flags) } });
        return;
      }
      const isNewArea = !(state.world.discoveredAreas || []).includes(nextAreaId);
      const spawn = AREA_MAPS[nextAreaId]?.spawn || { x: 1, y: 1 };
      const nextWorld = {
        ...state.world,
        areaId: nextAreaId,
        playerPos: { ...spawn },
        playerFacing: 'down',
        stepsInArea: 0,
        discoveredAreas: isNewArea
          ? [...(state.world.discoveredAreas || []), nextAreaId]
          : [...(state.world.discoveredAreas || [])],
      };
      const questRuntime = resolveQuestRuntime({
        event: { type: 'enter-area', areaId: nextAreaId },
        world: nextWorld,
      });
      const syncedSystems = syncWorldSystems(state.worldSystems);
      const regionId = AREAS[nextAreaId]?.region;
      const reputationAfterMove = addReputation(questRuntime.reputation, regionId, isNewArea ? 2 : 0);
      let achievementRuntime = isNewArea
        ? resolveAchievementEvent({
          achievements: state.achievements,
          event: { type: 'discover-area', areaId: nextAreaId },
        })
        : { achievements: state.achievements, toast: null };
      for (let index = 0; index < (questRuntime.completedQuestCount || 0); index += 1) {
        achievementRuntime = resolveAchievementEvent({
          achievements: achievementRuntime.achievements,
          event: { type: 'complete-quest' },
        });
      }
      dispatch({
        type: 'PATCH',
        payload: {
          world: questRuntime.world,
          team: questRuntime.team,
          quests: questRuntime.quests,
          inventory: questRuntime.inventory,
          money: questRuntime.money,
          reputation: reputationAfterMove,
          achievements: achievementRuntime.achievements,
          questToast: questRuntime.questToast,
          questPopup: questRuntime.questPopup || state.questPopup,
          achievementToast: achievementRuntime.toast || state.achievementToast,
          worldSystems: syncedSystems,
        },
      });
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
      saveGame({
        ...state,
        world: questRuntime.world,
        team: questRuntime.team,
        quests: questRuntime.quests,
        inventory: questRuntime.inventory,
        money: questRuntime.money,
        reputation: reputationAfterMove,
        achievements: achievementRuntime.achievements,
        worldSystems: syncedSystems,
      }, state.activeSaveSlot || 1);
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
    },

    async fastTravel(nextAreaId) {
      const area = AREAS[nextAreaId];
      if (!area) return false;
      const discovered = state.world.discoveredAreas || [];
      if (!discovered.includes(nextAreaId)) {
        dispatch({ type: 'PATCH', payload: { error: 'Area ainda nao descoberta para fast-travel.' } });
        return false;
      }
      const allowedTypes = new Set(['town', 'center', 'shop', 'gym']);
      if (!allowedTypes.has(area.type)) {
        dispatch({ type: 'PATCH', payload: { error: 'Fast-travel disponivel apenas para hubs.' } });
        return false;
      }
      const missing = (area.requires || []).filter((flag) => !(state.world.flags || []).includes(flag));
      if (missing.length) {
        dispatch({ type: 'PATCH', payload: { error: lockMessageForArea(nextAreaId, state.world.flags) } });
        return false;
      }
      const spawn = AREA_MAPS[nextAreaId]?.spawn || { x: 1, y: 1 };
      const nextWorld = {
        ...state.world,
        areaId: nextAreaId,
        playerPos: { ...spawn },
        playerFacing: 'down',
        stepsInArea: 0,
        discoveredAreas: [...discovered],
      };
      const questRuntime = resolveQuestRuntime({
        event: { type: 'enter-area', areaId: nextAreaId },
        world: nextWorld,
      });
      const syncedSystems = syncWorldSystems(state.worldSystems);
      let achievementRuntime = { achievements: state.achievements, toast: null };
      for (let index = 0; index < (questRuntime.completedQuestCount || 0); index += 1) {
        achievementRuntime = resolveAchievementEvent({
          achievements: achievementRuntime.achievements,
          event: { type: 'complete-quest' },
        });
      }
      dispatch({
        type: 'PATCH',
        payload: {
          world: questRuntime.world,
          team: questRuntime.team,
          quests: questRuntime.quests,
          inventory: questRuntime.inventory,
          money: questRuntime.money,
          reputation: questRuntime.reputation,
          achievements: achievementRuntime.achievements,
          questToast: questRuntime.questToast,
          questPopup: questRuntime.questPopup || state.questPopup,
          achievementToast: achievementRuntime.toast || state.achievementToast,
          worldSystems: syncedSystems,
        },
      });
      return true;
    },

    async walkStep() {
      const area = AREAS[state.world.areaId];
      if (!area?.canEncounter) return;

      const steps = state.world.stepsInArea + 1;
      const newWorld = { ...state.world, stepsInArea: steps };
      const outside = applyOutsideStatusStep(state.team);
      dispatch({ type: 'PATCH', payload: { world: newWorld, team: outside.team } });

      const preset = getMapPresetById(state.world.mapPreset);
      const weather = state.worldSystems?.weather || 'clear';
      const pathMod = pathChoiceModifier(state.worldSystems).encounterRate || 1;
      const weatherMod = weather === 'storm' || weather === 'mist' ? 1.08 : weather === 'clear' ? 0.96 : 1;
      const abilityMod = explorationEncounterModifier(outside.team);
      const chance = Math.max(0.04, Math.min(0.4, (preset.encounterRate || 0.16) * pathMod * weatherMod * abilityMod));
      if (Math.random() > chance) return;
      const rolled = rollEncounter(area.id);
      if (!rolled) return;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const scaledLevel = adjustEnemyLevel(rolled.level, state.world.mapPreset);
        const wild = await fetchPokemonWithMoves(rolled.species, scaledLevel, 'wild');
        const battle = startWildBattle(state.team, wild);
        const nextPokedex = markSeen(state.pokedex, rolled.species);
        dispatch({ type: 'PATCH', payload: { battle, pokedex: nextPokedex, screen: SCREENS.BATTLE } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async movePlayer(direction) {
      const areaId = state.world.areaId;
      const map = AREA_MAPS[areaId];
      if (!map) return;

      const dirMap = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      };
      const dir = dirMap[direction];
      if (!dir) return;
      const nextFrame = state.world.playerFrame === 0 ? 1 : 0;

      const nextPos = {
        x: state.world.playerPos.x + dir.x,
        y: state.world.playerPos.y + dir.y,
      };
      const nextTile = getTileAt(areaId, nextPos.x, nextPos.y);
      const blockingNpc = tileHasNpc(areaId, nextPos.x, nextPos.y);
      if (blockingNpc) {
        dispatch({
          type: 'PATCH',
          payload: {
            world: {
              ...state.world,
              playerFacing: direction,
              playerFrame: nextFrame,
            },
          },
        });
        return;
      }
      if (isBlockingTile(nextTile)) {
        dispatch({
          type: 'PATCH',
          payload: {
            world: {
              ...state.world,
              playerFacing: direction,
              playerFrame: nextFrame,
            },
          },
        });
        return;
      }

      const exit = findExit(areaId, nextPos.x, nextPos.y);
      if (exit) {
        if (!canTravel(areaId, exit.to, state.world.flags)) {
          dispatch({ type: 'PATCH', payload: { error: lockMessageForArea(exit.to, state.world.flags) } });
          return;
        }
        const isNewArea = !(state.world.discoveredAreas || []).includes(exit.to);
        const nextWorld = {
          ...state.world,
          areaId: exit.to,
          playerPos: { ...(exit.spawn || AREA_MAPS[exit.to]?.spawn || { x: 1, y: 1 }) },
          playerFacing: direction,
          playerFrame: nextFrame,
          stepsInArea: 0,
          discoveredAreas: isNewArea
            ? [...(state.world.discoveredAreas || []), exit.to]
            : [...(state.world.discoveredAreas || [])],
        };
        const questRuntime = resolveQuestRuntime({
          event: { type: 'enter-area', areaId: exit.to },
          world: nextWorld,
        });
        const syncedSystems = syncWorldSystems(state.worldSystems);
        const regionId = AREAS[exit.to]?.region;
        const reputationAfterMove = addReputation(questRuntime.reputation, regionId, isNewArea ? 2 : 0);
        let achievementRuntime = isNewArea
          ? resolveAchievementEvent({
            achievements: state.achievements,
            event: { type: 'discover-area', areaId: exit.to },
          })
          : { achievements: state.achievements, toast: null };
        for (let index = 0; index < (questRuntime.completedQuestCount || 0); index += 1) {
          achievementRuntime = resolveAchievementEvent({
            achievements: achievementRuntime.achievements,
            event: { type: 'complete-quest' },
          });
        }
        dispatch({
          type: 'PATCH',
          payload: {
            world: questRuntime.world,
            team: questRuntime.team,
            quests: questRuntime.quests,
            inventory: questRuntime.inventory,
            money: questRuntime.money,
            reputation: reputationAfterMove,
            achievements: achievementRuntime.achievements,
            questToast: questRuntime.questToast,
            questPopup: questRuntime.questPopup || state.questPopup,
            achievementToast: achievementRuntime.toast || state.achievementToast,
            worldSystems: syncedSystems,
          },
        });
        return;
      }

      const nextWorld = {
        ...state.world,
        playerPos: nextPos,
        playerFacing: direction,
        playerFrame: nextFrame,
        stepsInArea: state.world.stepsInArea + 1,
      };
      const outside = applyOutsideStatusStep(state.team);
      const daycareRuntime = advanceDaycare(state.daycare, outside.team, 1);
      dispatch({
        type: 'PATCH',
        payload: {
          world: nextWorld,
          team: daycareRuntime.team,
          daycare: daycareRuntime.daycare,
          questToast: daycareRuntime.hatchable.length ? `Egg pronto para chocar: ${daycareRuntime.hatchable[0].species}` : state.questToast,
        },
      });

      const area = AREAS[areaId];
      if (!area?.canEncounter) return;

      const baseChance = getMapPresetById(state.world.mapPreset).encounterRate ?? 0.16;
      const weather = state.worldSystems?.weather || 'clear';
      const pathMod = pathChoiceModifier(state.worldSystems).encounterRate || 1;
      const weatherMod = weather === 'storm' || weather === 'mist' ? 1.08 : weather === 'clear' ? 0.96 : 1;
      const abilityMod = explorationEncounterModifier(daycareRuntime.team);
      const encounterChance = Math.max(0.04, Math.min(0.4, baseChance * pathMod * weatherMod * abilityMod));
      if (!isEncounterTile(nextTile)) return;
      if (Math.random() > encounterChance) return;

      const rolled = rollEncounter(areaId);
      if (!rolled) return;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const scaledLevel = adjustEnemyLevel(rolled.level, state.world.mapPreset);
        const wild = await fetchPokemonWithMoves(rolled.species, scaledLevel, 'wild');
        const battle = startWildBattle(state.team, wild);
        const nextPokedex = markSeen(state.pokedex, rolled.species);
        dispatch({ type: 'PATCH', payload: { battle, pokedex: nextPokedex, screen: SCREENS.BATTLE } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    interactNpc() {
      const dirMap = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      };
      const facing = dirMap[state.world.playerFacing] || { x: 0, y: 1 };
      const targetPos = {
        x: state.world.playerPos.x + facing.x,
        y: state.world.playerPos.y + facing.y,
      };
      const npc = tileHasNpc(state.world.areaId, targetPos.x, targetPos.y);
      if (!npc) return false;
      const questRuntime = resolveQuestRuntime({
        event: { type: 'talk-npc', npcId: npc.id },
      });
      const guidance = getTrackedQuestGuidance(questRuntime.quests);
      const mentorLine = npc.mentor && guidance
        ? `Dica: ${guidance.objectiveText}`
        : null;
      const lines = [...(npc.dialogue || [`${npc.name}: ...`])];
      if (mentorLine) lines.push(mentorLine);
      let achievementRuntime = { achievements: state.achievements, toast: null };
      for (let index = 0; index < (questRuntime.completedQuestCount || 0); index += 1) {
        achievementRuntime = resolveAchievementEvent({
          achievements: achievementRuntime.achievements,
          event: { type: 'complete-quest' },
        });
      }

      dispatch({
        type: 'PATCH',
        payload: {
          world: questRuntime.world,
          team: questRuntime.team,
          quests: questRuntime.quests,
          inventory: questRuntime.inventory,
          money: questRuntime.money,
          reputation: questRuntime.reputation,
          achievements: achievementRuntime.achievements,
          questToast: questRuntime.questToast,
          questPopup: questRuntime.questPopup || state.questPopup,
          achievementToast: achievementRuntime.toast || state.achievementToast,
          profile: {
            ...state.profile,
            codexViewedNpcs: { ...(state.profile?.codexViewedNpcs || {}), [npc.id]: true },
          },
          error: lines.join(' '),
        },
      });
      return true;
    },

    async challengeTrainer(trainerId) {
      if (state.world.defeatedTrainers[trainerId]) return;
      const trainer = TRAINERS[trainerId];
      if (!trainer) return;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const enemyTeam = [];
        for (const spec of trainer.team) {
          const scaledLevel = adjustEnemyLevel(spec.level, state.world.mapPreset);
          enemyTeam.push(await fetchPokemonWithMoves(spec.species, scaledLevel, 'trainer'));
        }
        const battle = startTrainerBattle(state.team, enemyTeam, trainerId);
        dispatch({ type: 'PATCH', payload: { battle, screen: SCREENS.BATTLE } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async challengeGym(gymId = 'verdant-gym') {
      const gym = GYMS[gymId];
      if (!gym) return;
      if (state.world.gymsDefeated[gymId]) return;
      if (!state.world.flags.includes(gym.unlockFlag)) return;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const enemyTeam = [];
        for (const spec of gym.team) {
          const scaledLevel = adjustEnemyLevel(spec.level, state.world.mapPreset);
          enemyTeam.push(await fetchPokemonWithMoves(spec.species, scaledLevel, 'leader'));
        }
        const battle = startTrainerBattle(state.team, enemyTeam, gymId);
        dispatch({ type: 'PATCH', payload: { battle, screen: SCREENS.BATTLE } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async battleTurn(playerMoveIndex) {
      const battle = state.battle;
      if (!battle || battle.phase !== 'active') return;

      const player = battle.playerTeam[battle.playerActiveIndex];
      const enemy = battle.enemyTeam[battle.enemyActiveIndex];
      if (!player || !enemy) {
        const result = !player ? 'lose' : 'win';
        dispatch({
          type: 'PATCH',
          payload: {
            battle: {
              ...battle,
              phase: 'ended',
              result,
              log: [...battle.log.slice(-19), 'A batalha terminou automaticamente.'],
            },
          },
        });
        return;
      }

      const selectedPlayerMove = player?.moves?.[playerMoveIndex] || player?.moves?.[0] || struggleMove();
      const playerMove = (selectedPlayerMove.currentPp ?? 1) > 0 ? selectedPlayerMove : struggleMove();
      let battleForTurn = battle;
      if (!battle.wild) {
        const switchIdx = shouldAiSwitch(battle.enemyTeam, battle.enemyActiveIndex, player);
        if (switchIdx >= 0) {
          battleForTurn = {
            ...battleForTurn,
            enemyActiveIndex: switchIdx,
            log: [...battleForTurn.log.slice(-19), `${battleForTurn.enemyTeam[switchIdx].name} foi enviado para batalha!`],
          };
          dispatch({ type: 'PATCH', payload: { battle: battleForTurn } });
        }
      }
      const enemyActive = battleForTurn.enemyTeam[battleForTurn.enemyActiveIndex];
      const enemyMove = selectBestMove(enemyActive, player) || enemyActive?.moves?.[0] || struggleMove();

      const nextBattle = runBattleTurn(battleForTurn, playerMove, enemyMove);
      dispatch({ type: 'PATCH', payload: { battle: nextBattle } });

      if (nextBattle.phase !== 'ended') {
        return;
      }

      const playerWon = nextBattle.result === 'win';
      if (!playerWon) {
        dispatch({
          type: 'PATCH',
          payload: {
            team: healTeam(nextBattle.playerTeam),
            battleSummary: {
              result: 'lose',
              title: 'Batalha Encerrada',
              message: 'Voce perdeu a batalha.',
              xpTotal: 0,
              moneyGained: 0,
              xpToNextLevel: xpRemainingToNextLevel(nextBattle.playerTeam?.[0]),
            },
          },
        });
        return;
      }

      const defeated = nextBattle.enemyTeam[nextBattle.enemyActiveIndex];
      const isGym = nextBattle.trainerId && !!GYMS[nextBattle.trainerId];
      const areaBoss = getAreaBossById(nextBattle.trainerId);
      const moneyMod = pathChoiceModifier(state.worldSystems).money || 1;
      const trainerReward = TRAINERS[nextBattle.trainerId]?.rewardMoney
        || GYMS[nextBattle.trainerId]?.rewardMoney
        || areaBoss?.rewardMoney
        || 0;
      const adjustedTrainerReward = Math.floor(trainerReward * moneyMod);
      const reward = applyBattleRewards({
        playerTeam: nextBattle.playerTeam,
        defeatedPokemon: defeated,
        money: state.money,
        moneyReward: adjustedTrainerReward,
      });
      const xpTotal = Object.values(reward.xpByPokemon || {}).reduce((sum, value) => sum + value, 0);

      let nextTeam = reward.playerTeam;

      const evolvedChecks = await Promise.all(
        nextTeam.map(async (member) => {
          if (!member.evolutionChainUrl) return member;
          try {
            const chain = await withTimeout(fetchEvolutionChainByUrl(member.evolutionChainUrl), 4000, null);
            if (!chain) return member;
            const readiness = getEvolutionReadiness(chain, member);
            return {
              ...member,
              evolutionReady: readiness.canEvolve,
              nextEvolutionLevel: readiness.requiredLevel ?? member.nextEvolutionLevel,
            };
          } catch (_error) {
            return member;
          }
        })
      );
      nextTeam = evolvedChecks;
      let pendingMoveLearn = null;
      const levelUps = reward.levelUpsByPokemon || {};
      for (const [uid, levelInfo] of Object.entries(levelUps)) {
        const member = nextTeam.find((teamMember) => teamMember.uid === uid);
        if (!member) continue;
        try {
          const pokemonData = await withTimeout(fetchPokemonByNameOrId(member.species), 3500, null);
          if (!pokemonData) continue;
          const newlyUnlocked = getNewLevelUpMoves(
            pokemonData,
            levelInfo.previousLevel,
            levelInfo.newLevel,
            member.knownMoveSlugs || member.moves.map((move) => move.slug)
          );
          if (newlyUnlocked.length === 0) continue;
          const moveSlug = newlyUnlocked[newlyUnlocked.length - 1].slug;
          const moveDetail = await withTimeout(fetchMoveByNameOrId(moveSlug), 3000, null);
          pendingMoveLearn = {
            pokemonUid: uid,
            pokemonName: member.name,
            move: toLearnableMove(moveDetail, moveSlug),
          };
          break;
        } catch (_error) {
          // Skip if move fetch fails.
        }
      }

      const nextDefeatedTrainers = { ...state.world.defeatedTrainers };
      const nextGymsDefeated = { ...state.world.gymsDefeated };
      let nextBadges = state.badges;
      let nextFlags = [...state.world.flags];
      let nextBossesDefeated = { ...(state.worldSystems?.bossesDefeated || {}) };
      let nextInventoryWithBossReward = state.inventory;

      if (nextBattle.trainerId && TRAINERS[nextBattle.trainerId]) {
        nextDefeatedTrainers[nextBattle.trainerId] = true;
        if (!nextFlags.includes('FIRST_ROUTE_CLEAR')) nextFlags.push('FIRST_ROUTE_CLEAR');
      }

      if (isGym) {
        nextGymsDefeated[nextBattle.trainerId] = true;
        nextBadges = addBadge(nextBadges, GYMS[nextBattle.trainerId].badgeId);
      }

      if (areaBoss) {
        nextBossesDefeated[areaBoss.id] = true;
        for (const [itemId, qty] of Object.entries(areaBoss.rewardItems || {})) {
          nextInventoryWithBossReward = addItem(nextInventoryWithBossReward, itemId, qty);
        }
      }

      const rewardCard = await withTimeout(
        searchTcgCards({ q: `nationalPokedexNumbers:${defeated.pokemonId}`, pageSize: 1 }),
        3000,
        null
      );
      const card = rewardCard?.data?.[0];
      const nextCollection = { ...state.tcg.collection };
      if (card?.id) {
        nextCollection[card.id] = card;
      }

      const nextWorldAfterBattle = {
        ...state.world,
        defeatedTrainers: nextDefeatedTrainers,
        gymsDefeated: nextGymsDefeated,
        flags: nextFlags,
      };
      const questRuntime = nextBattle.trainerId
        ? resolveQuestRuntime({
          event: { type: 'defeat-trainer', trainerId: nextBattle.trainerId, areaId: state.world.areaId },
          world: nextWorldAfterBattle,
          inventory: nextInventoryWithBossReward,
          money: reward.money,
          team: nextTeam,
        })
        : {
          quests: state.quests,
          world: nextWorldAfterBattle,
          inventory: state.inventory,
          money: reward.money,
          team: nextTeam,
          reputation: state.reputation,
          questToast: null,
          questPopup: null,
          completedQuestCount: 0,
        };
      const regionId = AREAS[state.world.areaId]?.region;
      const reputationAfterBattle = nextBattle.trainerId
        ? addReputation(questRuntime.reputation, regionId, 3)
        : questRuntime.reputation;

      let achievementRuntime = { achievements: state.achievements, toast: null };
      if (nextBattle.trainerId) {
        achievementRuntime = resolveAchievementEvent({
          achievements: state.achievements,
          event: { type: 'defeat-trainer', trainerId: nextBattle.trainerId },
        });
      }
      for (let index = 0; index < (questRuntime.completedQuestCount || 0); index += 1) {
        achievementRuntime = resolveAchievementEvent({
          achievements: achievementRuntime.achievements,
          event: { type: 'complete-quest' },
        });
      }

      dispatch({
        type: 'PATCH',
        payload: {
          team: questRuntime.team,
          money: questRuntime.money,
          inventory: questRuntime.inventory,
          world: questRuntime.world,
          quests: questRuntime.quests,
          reputation: reputationAfterBattle,
          achievements: achievementRuntime.achievements,
          questToast: questRuntime.questToast,
          questPopup: questRuntime.questPopup || state.questPopup,
          achievementToast: achievementRuntime.toast || state.achievementToast,
          badges: nextBadges,
          pendingLevelUp: reward.leveledUp ? questRuntime.team[0] : null,
          pendingEvolution: null,
          pendingMoveLearn,
          battleSummary: {
            result: 'win',
            title: 'Vitoria!',
            message: `${defeated?.name || 'Inimigo'} derrotado.`,
            xpTotal,
            moneyGained: adjustedTrainerReward,
            xpToNextLevel: xpRemainingToNextLevel(questRuntime.team[0]),
          },
          tcg: { ...state.tcg, collection: nextCollection },
          worldSystems: {
            ...state.worldSystems,
            bossesDefeated: nextBossesDefeated,
          },
        },
      });
    },

    runFromBattle() {
      if (!state.battle?.wild || !state.battle?.canRun) return false;
      if (Math.random() < 0.8) {
        dispatch({
          type: 'PATCH',
          payload: {
            team: state.battle.playerTeam,
            battle: null,
            screen: SCREENS.WORLD,
          },
        });
        return true;
      }
      return false;
    },

    async tryCapture(itemId = 'pokeball') {
      const battle = state.battle;
      if (!battle?.wild) return false;
      if ((state.inventory[itemId] || 0) <= 0) return false;

      const target = battle.enemyTeam[battle.enemyActiveIndex];
      const chance = calculateCaptureChance({ targetPokemon: target, ballBonus: ITEMS[itemId]?.captureBonus || 1 });
      const success = Math.random() <= chance;

      const nextInventory = consumeItem(state.inventory, itemId, 1);
      if (!success) {
        dispatch({ type: 'PATCH', payload: { inventory: nextInventory } });
        return false;
      }

      let nextTeam = battle.playerTeam;
      let nextStorage = state.storage;
      const captured = { ...target, owner: 'player' };
      let capturedTo = 'team';
      if (canAddToTeam(nextTeam)) {
        nextTeam = addPokemonToTeam(nextTeam, captured);
      } else {
        nextStorage = addPokemonToStorage(nextStorage, captured);
        capturedTo = 'storage';
      }

      const lead = nextTeam[0];
      const captureXp = Math.max(5, Math.floor((target.level || 1) * 4));
      let leveledUp = false;
      let pendingMoveLearn = state.pendingMoveLearn;
      if (lead) {
        const xpResult = applyXp(lead, captureXp);
        leveledUp = xpResult.leveledUp;
        nextTeam = replaceTeamMember(nextTeam, lead.uid, xpResult.pokemon);
        if (xpResult.leveledUp) {
          try {
            const pokemonData = await withTimeout(fetchPokemonByNameOrId(lead.species), 3500, null);
            const newlyUnlocked = getNewLevelUpMoves(
              pokemonData,
              xpResult.previousLevel,
              xpResult.newLevel,
              lead.knownMoveSlugs || lead.moves.map((move) => move.slug)
            );
            if (newlyUnlocked.length > 0) {
              const moveSlug = newlyUnlocked[newlyUnlocked.length - 1].slug;
              const moveDetail = await withTimeout(fetchMoveByNameOrId(moveSlug), 3000, null);
              pendingMoveLearn = {
                pokemonUid: lead.uid,
                pokemonName: lead.name,
                move: toLearnableMove(moveDetail, moveSlug),
              };
            }
          } catch (_error) {
            // Ignore move learn fetch errors.
          }
        }
      }

      const questRuntime = resolveQuestRuntime({
        event: { type: 'capture', species: target.species, areaId: state.world.areaId },
        inventory: nextInventory,
        team: nextTeam,
      });
      const regionId = AREAS[state.world.areaId]?.region;
      const reputationAfterCapture = addReputation(questRuntime.reputation, regionId, 1);

      let achievementRuntime = resolveAchievementEvent({
        achievements: state.achievements,
        event: { type: 'capture', species: target.species },
      });
      for (let index = 0; index < (questRuntime.completedQuestCount || 0); index += 1) {
        achievementRuntime = resolveAchievementEvent({
          achievements: achievementRuntime.achievements,
          event: { type: 'complete-quest' },
        });
      }

      dispatch({
        type: 'PATCH',
        payload: {
          inventory: questRuntime.inventory,
          team: questRuntime.team,
          storage: nextStorage,
          pokedex: markCaught(state.pokedex, target.species),
          quests: questRuntime.quests,
          world: questRuntime.world,
          money: questRuntime.money,
          reputation: reputationAfterCapture,
          achievements: achievementRuntime.achievements,
          questToast: questRuntime.questToast,
          questPopup: questRuntime.questPopup || state.questPopup,
          achievementToast: achievementRuntime.toast || state.achievementToast,
          battle: {
            ...battle,
            phase: 'ended',
            result: 'captured',
            log: [...battle.log.slice(-18), `${target.name} foi capturado!`],
          },
          pendingLevelUp: leveledUp ? questRuntime.team[0] : state.pendingLevelUp,
          pendingMoveLearn,
          captureSummary: {
            title: 'Pokemon Capturado!',
            species: target.name,
            level: target.level,
            capturedTo,
            xpGained: captureXp,
            xpToNextLevel: xpRemainingToNextLevel(questRuntime.team[0]),
          },
        },
      });
      return true;
    },

    leaveBattle() {
      dispatch({
        type: 'PATCH',
        payload: {
          team: state.battle?.playerTeam || state.team,
          battle: null,
          battleSummary: null,
          captureSummary: null,
          screen: SCREENS.WORLD,
        },
      });
    },

    switchBattlePokemon(uid) {
      if (!state.battle || state.battle.phase !== 'active') return false;
      const idx = state.battle.playerTeam.findIndex((member) => member.uid === uid);
      if (idx < 0) return false;
      const target = state.battle.playerTeam[idx];
      if (target.fainted || target.currentHp <= 0) return false;
      if (idx === state.battle.playerActiveIndex) return false;

      dispatch({
        type: 'PATCH',
        payload: {
          battle: {
            ...state.battle,
            playerActiveIndex: idx,
            log: [...state.battle.log.slice(-19), `Vai ${target.name}!`],
          },
        },
      });
      return true;
    },

    finalizeBattleFlow() {
      dispatch({
        type: 'PATCH',
        payload: {
          battle: null,
          battleSummary: null,
          captureSummary: null,
          screen: SCREENS.WORLD,
        },
      });
    },

    useBattleItem(itemId) {
      if (!state.battle || state.battle.phase !== 'active') return false;
      if ((state.inventory[itemId] || 0) <= 0) return false;
      if (itemId === 'pokeball') return false;
      const item = ITEMS[itemId];
      if (!item) return false;

      const activeIndex = state.battle.playerActiveIndex;
      const target = state.battle.playerTeam[activeIndex];
      if (!target) return false;

      if (item.kind === 'battle-buff') {
        const nextInventory = consumeItem(state.inventory, itemId, 1);
        const nextBuffs = { ...state.battle.playerBuffs };
        nextBuffs[item.stat] = Math.min(2.2, (nextBuffs[item.stat] || 1) * (item.multiplier || 1.2));
        if (item.id === 'guardSpec') nextBuffs.guardSpec = true;
        dispatch({
          type: 'PATCH',
          payload: {
            inventory: nextInventory,
            battle: {
              ...state.battle,
              playerBuffs: nextBuffs,
              log: [...state.battle.log.slice(-19), `${target.name} recebeu buff com ${item.name}.`],
            },
          },
        });
        return true;
      }

      if (item.kind === 'status-heal') {
        if (!target.status) return false;
        const nextInventory = consumeItem(state.inventory, itemId, 1);
        const nextPlayerTeam = [...state.battle.playerTeam];
        nextPlayerTeam[activeIndex] = { ...target, status: null };
        dispatch({
          type: 'PATCH',
          payload: {
            inventory: nextInventory,
            battle: {
              ...state.battle,
              playerTeam: nextPlayerTeam,
              log: [...state.battle.log.slice(-19), `${target.name} foi curado de status.`],
            },
          },
        });
        return true;
      }

      const updated = applyItemToPokemon(target, itemId);
      const changed = updated.currentHp !== target.currentHp || updated.fainted !== target.fainted;
      if (!changed) return false;

      const nextPlayerTeam = [...state.battle.playerTeam];
      nextPlayerTeam[activeIndex] = updated;
      const nextInventory = consumeItem(state.inventory, itemId, 1);

      dispatch({
        type: 'PATCH',
        payload: {
          inventory: nextInventory,
          battle: {
            ...state.battle,
            playerTeam: nextPlayerTeam,
            log: [...state.battle.log.slice(-19), `${updated.name} recuperou HP com item.`],
          },
        },
      });
      return true;
    },

    useItem(itemId, uid) {
      if ((state.inventory[itemId] || 0) <= 0) return;
      const target = state.team.find((member) => member.uid === uid);
      if (!target) return;
      if (ITEMS[itemId]?.kind === 'evolution') return;
      const updated = applyItemToPokemon(target, itemId);
      const changed = (
        updated.currentHp !== target.currentHp ||
        updated.fainted !== target.fainted ||
        updated.status !== target.status
      );
      if (!changed) return;
      const nextTeam = replaceTeamMember(state.team, uid, updated);
      const nextInventory = consumeItem(state.inventory, itemId, 1);
      dispatch({ type: 'PATCH', payload: { team: nextTeam, inventory: nextInventory } });
    },

    buyItem(itemId, qty = 1) {
      const item = ITEMS[itemId];
      if (!item) return false;
      const dailyEvent = getDailyEvent(syncWorldSystems(state.worldSystems));
      const discount = dailyEvent?.shopDiscount || 1;
      const stock = state.worldSystems?.shopStock || SHOP_CATALOG;
      if (!stock.includes(itemId)) return false;
      const cost = Math.floor(item.buyPrice * qty * discount);
      const result = spendMoney(state.money, cost);
      if (!result.ok) return false;
      const nextInventory = addItem(state.inventory, itemId, qty);
      const nextSystems = markTutorialTipSeen(syncWorldSystems(state.worldSystems), 'firstShopBuy');
      dispatch({
        type: 'PATCH',
        payload: {
          money: result.money,
          inventory: nextInventory,
          worldSystems: nextSystems,
          questToast: !state.worldSystems?.tutorialTipsSeen?.firstShopBuy ? TUTORIAL_TIPS.firstShopBuy : state.questToast,
        },
      });
      return true;
    },

    craftItem(recipeId) {
      const recipe = CRAFTING_RECIPES.find((entry) => entry.id === recipeId);
      if (!recipe) return false;
      for (const [itemId, qty] of Object.entries(recipe.cost || {})) {
        if ((state.inventory[itemId] || 0) < qty) return false;
      }

      let nextInventory = { ...state.inventory };
      for (const [itemId, qty] of Object.entries(recipe.cost || {})) {
        nextInventory = consumeItem(nextInventory, itemId, qty);
      }
      for (const [itemId, qty] of Object.entries(recipe.output || {})) {
        nextInventory = addItem(nextInventory, itemId, qty);
      }

      const nextSystems = markTutorialTipSeen(syncWorldSystems(state.worldSystems), 'firstCraft');
      dispatch({
        type: 'PATCH',
        payload: {
          inventory: nextInventory,
          worldSystems: nextSystems,
          questToast: !state.worldSystems?.tutorialTipsSeen?.firstCraft ? TUTORIAL_TIPS.firstCraft : state.questToast,
        },
      });
      return true;
    },

    async fishEncounter(rodKind = 'oldRod') {
      const areaId = state.world.areaId;
      const rodItemId = rodKind === 'goodRod' ? 'goodRod' : 'oldRod';
      if ((state.inventory[rodItemId] || 0) <= 0) return false;
      const dailyEvent = getDailyEvent(syncWorldSystems(state.worldSystems));
      const catchEntry = chooseFishingEntry(areaId, rodKind, state.worldSystems?.weather || 'clear', dailyEvent);
      if (!catchEntry) return false;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const wild = await fetchPokemonWithMoves(catchEntry.species, catchEntry.level, 'wild');
        const battle = startWildBattle(state.team, wild);
        const nextPokedex = markSeen(state.pokedex, catchEntry.species);
        const nextSystems = markTutorialTipSeen(syncWorldSystems(state.worldSystems), 'firstFish');
        dispatch({
          type: 'PATCH',
          payload: {
            battle,
            pokedex: nextPokedex,
            screen: SCREENS.BATTLE,
            worldSystems: nextSystems,
            questToast: !state.worldSystems?.tutorialTipsSeen?.firstFish ? TUTORIAL_TIPS.firstFish : state.questToast,
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      return true;
    },

    depositDaycare(uid) {
      if (!uid) return false;
      if ((state.daycare?.slots || []).length >= 2) return false;
      const member = state.team.find((entry) => entry.uid === uid);
      if (!member) return false;
      const nextSlots = [...(state.daycare?.slots || []), { uid: member.uid, species: member.species, name: member.name }];
      const nextDaycare = { ...normalizeDaycare(state.daycare), slots: nextSlots };
      dispatch({ type: 'PATCH', payload: { daycare: nextDaycare } });
      return true;
    },

    withdrawDaycare(uid) {
      const nextSlots = (state.daycare?.slots || []).filter((entry) => entry.uid !== uid);
      dispatch({ type: 'PATCH', payload: { daycare: { ...normalizeDaycare(state.daycare), slots: nextSlots } } });
      return true;
    },

    async hatchEgg(eggId) {
      const egg = (state.daycare?.eggs || []).find((entry) => entry.id === eggId);
      if (!egg || egg.progress < egg.hatchSteps) return false;
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const newborn = await fetchPokemonWithMoves(egg.species, 1, 'player');
        let nextTeam = state.team;
        let nextStorage = state.storage;
        if (canAddToTeam(nextTeam)) {
          nextTeam = addPokemonToTeam(nextTeam, newborn);
        } else {
          nextStorage = addPokemonToStorage(nextStorage, newborn);
        }
        const nextDaycare = {
          ...normalizeDaycare(state.daycare),
          eggs: (state.daycare?.eggs || []).filter((entry) => entry.id !== eggId),
        };
        dispatch({
          type: 'PATCH',
          payload: {
            team: nextTeam,
            storage: nextStorage,
            pokedex: markCaught(state.pokedex, newborn.species),
            daycare: nextDaycare,
            questToast: `Egg chocou: ${newborn.name}!`,
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      return true;
    },

    setPathChoice(choiceId) {
      if (!QUEST_PATH_CHOICES.find((entry) => entry.id === choiceId)) return false;
      dispatch({
        type: 'PATCH',
        payload: {
          worldSystems: {
            ...syncWorldSystems(state.worldSystems),
            pathChoice: choiceId,
            pathChoiceSelected: true,
          },
        },
      });
      return true;
    },

    runExpedition(expeditionId, memberUid) {
      const expedition = EXPEDITIONS[expeditionId];
      if (!expedition) return false;

      const discovered = state.world.discoveredAreas || [];
      if (!discovered.includes(expedition.unlockAreaId)) {
        dispatch({ type: 'PATCH', payload: { error: `Descubra ${AREAS[expedition.unlockAreaId]?.name || expedition.unlockAreaId} para liberar essa expedicao.` } });
        return false;
      }

      const currentState = normalizeExpeditions(state.expeditions);
      const phaseIndex = Number(currentState.progress?.[expeditionId] || 0);
      if (phaseIndex >= expedition.phases.length) {
        dispatch({ type: 'PATCH', payload: { questToast: `Expedicao ${expedition.name} ja concluida.` } });
        return false;
      }

      const phase = expedition.phases[phaseIndex];
      if (!discovered.includes(phase.areaId)) {
        dispatch({ type: 'PATCH', payload: { error: `Fase bloqueada. Primeiro descubra ${AREAS[phase.areaId]?.name || phase.areaId}.` } });
        return false;
      }

      const lead = state.team.find((entry) => entry.uid === memberUid) || state.team[0];
      if (!lead) return false;

      const levelGap = phase.recommendedLevel - (lead.level || 1);
      const successChance = Math.max(0.28, Math.min(0.96, 0.72 - levelGap * 0.05));
      const success = Math.random() <= successChance;
      const leadXp = success ? phase.baseXp : Math.max(120, Math.floor(phase.baseXp * 0.45));
      const sharedXp = Math.max(40, Math.floor(leadXp * 0.24));
      const nextTeam = state.team.map((member) => {
        const gain = member.uid === lead.uid ? leadXp : sharedXp;
        return applyXp(member, gain).pokemon;
      });

      let nextInventory = { ...state.inventory };
      let nextMoney = state.money;
      const nextExpeditions = normalizeExpeditions(currentState);

      if (success) {
        nextExpeditions.progress[expeditionId] = phaseIndex + 1;
        nextMoney += phase.rewardMoney || 0;
        for (const [itemId, qty] of Object.entries(phase.rewardItems || {})) {
          nextInventory = addItem(nextInventory, itemId, qty);
        }
      }

      const finished = nextExpeditions.progress[expeditionId] >= expedition.phases.length;
      if (finished && !nextExpeditions.completed[expeditionId]) {
        nextExpeditions.completed[expeditionId] = true;
        if (!nextExpeditions.log.includes(expeditionId)) nextExpeditions.log.push(expeditionId);
        nextMoney += expedition.completionBonus?.money || 0;
        for (const [itemId, qty] of Object.entries(expedition.completionBonus?.items || {})) {
          nextInventory = addItem(nextInventory, itemId, qty);
        }
      }

      dispatch({
        type: 'PATCH',
        payload: {
          team: nextTeam,
          inventory: nextInventory,
          money: nextMoney,
          expeditions: nextExpeditions,
          questToast: success
            ? `${phase.name} concluida! +${leadXp} XP no lider e +${sharedXp} XP no time.`
            : `${phase.name} incompleta. Mesmo assim: +${leadXp} XP no lider e +${sharedXp} XP no time.`,
        },
      });
      return true;
    },

    trainWithPokemon(targetUid, sourceUid) {
      if (!targetUid || !sourceUid || targetUid === sourceUid) return false;
      const targetInTeam = state.team.find((entry) => entry.uid === targetUid);
      if (!targetInTeam) return false;

      let source = state.storage.find((entry) => entry.uid === sourceUid);
      let nextStorage = [...state.storage];
      let nextTeam = [...state.team];
      let sourceOrigin = 'storage';

      if (source) {
        nextStorage = nextStorage.filter((entry) => entry.uid !== sourceUid);
      } else {
        source = state.team.find((entry) => entry.uid === sourceUid);
        sourceOrigin = 'team';
        if (!source || source.uid === targetUid || state.team.length <= 1) return false;
        nextTeam = nextTeam.filter((entry) => entry.uid !== sourceUid);
      }

      const targetAfterRemoval = nextTeam.find((entry) => entry.uid === targetUid);
      if (!targetAfterRemoval || !source) return false;

      const xpGain = Math.max(
        180,
        Math.floor(70 + (source.level || 1) * 56 + ((source.stats?.hp || 20) + (source.stats?.attack || 10)) * 0.9)
      );
      const trained = applyXp(targetAfterRemoval, xpGain).pokemon;
      nextTeam = replaceTeamMember(nextTeam, targetUid, trained);

      dispatch({
        type: 'PATCH',
        payload: {
          team: nextTeam,
          storage: nextStorage,
          questToast: `${targetAfterRemoval.name} recebeu ${xpGain} XP usando ${source.name} (${sourceOrigin}).`,
        },
      });
      return true;
    },

    async challengeAreaBoss() {
      const areaId = state.world.areaId;
      const boss = AREA_BOSSES[areaId];
      if (!boss) return false;
      if ((state.worldSystems?.bossesDefeated || {})[boss.id]) return false;
      if (boss.unlockFlag && !(state.world.flags || []).includes(boss.unlockFlag)) return false;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const scaled = adjustEnemyLevel(boss.level, state.world.mapPreset);
        const alpha = await fetchPokemonWithMoves(boss.species, scaled, 'boss');
        const battle = startTrainerBattle(state.team, [alpha], boss.id);
        dispatch({ type: 'PATCH', payload: { battle, screen: SCREENS.BATTLE } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      return true;
    },

    async tradeWithNpc(offerId) {
      const offer = NPC_TRADE_OFFERS.find((entry) => entry.id === offerId);
      if (!offer) return false;
      if (offer.location !== state.world.areaId) return false;
      if (offer.once && state.worldSystems?.tradeCompleted?.[offer.id]) return false;
      const candidate = state.team.find((member) => member.species === offer.wants && (member.level || 1) >= (offer.minLevel || 1));
      if (!candidate) return false;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const traded = await fetchPokemonWithMoves(offer.gives, Math.max(offer.minLevel || 1, candidate.level), 'player');
        const without = state.team.filter((member) => member.uid !== candidate.uid);
        const nextTeam = canAddToTeam(without) ? addPokemonToTeam(without, traded) : without;
        const nextStorage = canAddToTeam(without) ? state.storage : addPokemonToStorage(state.storage, traded);
        const nextSystems = syncWorldSystems(state.worldSystems);
        nextSystems.tradeCompleted = { ...(nextSystems.tradeCompleted || {}), [offer.id]: true };
        dispatch({
          type: 'PATCH',
          payload: {
            team: nextTeam,
            storage: nextStorage,
            pokedex: markCaught(state.pokedex, traded.species),
            worldSystems: nextSystems,
            questToast: `${offer.npc} trocou ${offer.wants} por ${traded.name}.`,
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      return true;
    },

    runBattleTower() {
      const avg = state.team.length
        ? state.team.reduce((sum, member) => sum + (member.level || 1), 0) / state.team.length
        : 1;
      const baseChance = Math.min(0.85, Math.max(0.25, 0.35 + avg / 140));
      const win = Math.random() <= baseChance;
      const currentTower = state.worldSystems?.tower || { streak: 0, bestStreak: 0, rank: 'Bronze' };
      const nextStreak = win ? currentTower.streak + 1 : 0;
      const nextBest = Math.max(currentTower.bestStreak || 0, nextStreak);
      const nextRank = rankByStreak(nextBest);
      const reward = win ? Math.floor(220 + avg * 12 + nextStreak * 30) : 0;
      const nextSystems = syncWorldSystems(state.worldSystems);
      nextSystems.tower = {
        streak: nextStreak,
        bestStreak: nextBest,
        rank: nextRank,
      };
      nextSystems.tutorialTipsSeen = {
        ...(nextSystems.tutorialTipsSeen || {}),
        firstTower: true,
      };
      dispatch({
        type: 'PATCH',
        payload: {
          money: state.money + reward,
          worldSystems: nextSystems,
          questToast: win
            ? `Battle Tower: vitoria! Streak ${nextStreak}. +$${reward}`
            : `Battle Tower: derrota. Melhor streak ${nextBest}.`,
        },
      });
      return win;
    },

    refreshDailyWorld() {
      const synced = syncWorldSystems(state.worldSystems);
      dispatch({ type: 'PATCH', payload: { worldSystems: synced } });
    },

    markNpcCodexViewed(npcId) {
      if (!npcId) return;
      dispatch({
        type: 'PATCH',
        payload: {
          profile: {
            ...state.profile,
            codexViewedNpcs: { ...(state.profile?.codexViewedNpcs || {}), [npcId]: true },
          },
        },
      });
    },

    healAtCenter() {
      dispatch({ type: 'PATCH', payload: { team: healTeam(state.team) } });
    },

    moveStorageToTeam(uid) {
      if (!canAddToTeam(state.team)) return;
      const moved = moveFromStorageToTeam({ storage: state.storage, team: state.team, uid });
      dispatch({ type: 'PATCH', payload: moved });
    },

    moveTeamToStorage(uid) {
      if (state.team.length <= 1) return;
      const moved = moveFromTeamToStorage({ storage: state.storage, team: state.team, uid });
      dispatch({ type: 'PATCH', payload: moved });
    },

    clearPopups() {
      dispatch({ type: 'PATCH', payload: { pendingEvolution: null, pendingLevelUp: null, pendingMoveLearn: null } });
    },

    learnPendingMove(replaceIndex = null) {
      const pending = state.pendingMoveLearn;
      if (!pending?.pokemonUid || !pending.move) return false;
      const member = state.team.find((pokemon) => pokemon.uid === pending.pokemonUid);
      if (!member) return false;

      const moveAlreadyKnown = member.moves.some((move) => move.slug === pending.move.slug);
      if (moveAlreadyKnown) {
        dispatch({ type: 'PATCH', payload: { pendingMoveLearn: null } });
        return true;
      }

      let nextMoves = [...member.moves];
      if (nextMoves.length < 4) {
        nextMoves.push(pending.move);
      } else if (replaceIndex !== null && replaceIndex >= 0 && replaceIndex < nextMoves.length) {
        nextMoves[replaceIndex] = pending.move;
      } else {
        return false;
      }

      const nextMember = {
        ...member,
        moves: nextMoves,
        knownMoveSlugs: Array.from(new Set([...(member.knownMoveSlugs || []), pending.move.slug])),
      };
      const nextTeam = replaceTeamMember(state.team, member.uid, nextMember);
      dispatch({ type: 'PATCH', payload: { team: nextTeam, pendingMoveLearn: null } });
      return true;
    },

    skipPendingMove() {
      const pending = state.pendingMoveLearn;
      if (!pending?.pokemonUid || !pending.move) {
        dispatch({ type: 'PATCH', payload: { pendingMoveLearn: null } });
        return;
      }
      const member = state.team.find((pokemon) => pokemon.uid === pending.pokemonUid);
      if (!member) {
        dispatch({ type: 'PATCH', payload: { pendingMoveLearn: null } });
        return;
      }
      const nextMember = {
        ...member,
        knownMoveSlugs: Array.from(new Set([...(member.knownMoveSlugs || []), pending.move.slug])),
      };
      const nextTeam = replaceTeamMember(state.team, member.uid, nextMember);
      dispatch({ type: 'PATCH', payload: { team: nextTeam, pendingMoveLearn: null } });
    },

    getItemEvolutions(uid) {
      const member = state.team.find((pokemon) => pokemon.uid === uid);
      if (!member) return [];
      return getItemEvolutionsForSpecies(member.species).filter((entry) => (state.inventory[entry.itemId] || 0) > 0);
    },

    async evolvePokemon(uid) {
      const member = state.team.find((pokemon) => pokemon.uid === uid);
      if (!member || !member.evolutionChainUrl) return false;

      try {
        const chain = await fetchEvolutionChainByUrl(member.evolutionChainUrl);
        const readiness = getEvolutionReadiness(chain, member);
        if (!readiness.canEvolve || !readiness.targetSpecies) return false;

        const evolved = await fetchPokemonWithMoves(readiness.targetSpecies, member.level, member.owner);
        evolved.uid = member.uid;
        evolved.currentXp = member.currentXp;
        evolved.currentHp = Math.max(1, evolved.currentHp);
        evolved.evolutionCount = (member.evolutionCount || 0) + 1;
        evolved.caughtAsEvolved = false;
        evolved.nextEvolutionLevel = evolved.evolutionCount >= 1 ? 9 : 6;
        evolved.evolutionReady = false;
        evolved.knownMoveSlugs = Array.from(new Set([...(member.knownMoveSlugs || []), ...(evolved.moves || []).map((move) => move.slug)]));

        const nextTeam = replaceTeamMember(state.team, uid, evolved);
        dispatch({
          type: 'PATCH',
          payload: {
            team: nextTeam,
            pendingEvolution: { from: member.name, to: evolved.name },
            pokedex: markCaught(state.pokedex, evolved.species),
          },
        });
        return true;
      } catch (_error) {
        return false;
      }
    },

    async evolvePokemonWithItem(uid, itemId) {
      const member = state.team.find((pokemon) => pokemon.uid === uid);
      if (!member) return false;
      if ((state.inventory[itemId] || 0) <= 0) return false;

      const candidate = getItemEvolutionsForSpecies(member.species).find((entry) => entry.itemId === itemId);
      if (!candidate?.targetSpecies) return false;

      try {
        const evolved = await fetchPokemonWithMoves(candidate.targetSpecies, member.level, member.owner);
        evolved.uid = member.uid;
        evolved.currentXp = member.currentXp;
        evolved.currentHp = Math.max(1, evolved.stats.hp - Math.max(0, member.stats.hp - member.currentHp));
        evolved.evolutionCount = (member.evolutionCount || 0) + 1;
        evolved.caughtAsEvolved = false;
        evolved.nextEvolutionLevel = evolved.evolutionCount >= 1 ? 9 : 6;
        evolved.evolutionReady = false;
        evolved.knownMoveSlugs = Array.from(new Set([...(member.knownMoveSlugs || []), ...(evolved.moves || []).map((move) => move.slug)]));

        const nextTeam = replaceTeamMember(state.team, uid, evolved);
        const nextInventory = consumeItem(state.inventory, itemId, 1);
        dispatch({
          type: 'PATCH',
          payload: {
            team: nextTeam,
            inventory: nextInventory,
            pendingEvolution: { from: member.name, to: evolved.name },
            pokedex: markCaught(state.pokedex, evolved.species),
          },
        });
        return true;
      } catch (_error) {
        return false;
      }
    },

    async refreshTcgSets() {
      const sets = await tcgdexListSets('en', { 'pagination:page': 1, 'pagination:itemsPerPage': 40 });
      dispatch({ type: 'PATCH', payload: { tcg: { ...state.tcg, sets } } });
    },

    async manualSave() {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
      saveGame(state, state.activeSaveSlot || 1);
      dispatch({ type: 'PATCH', payload: { saveSlots: listSaveSlots() } });
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
    },

    getStarterOptions() {
      return STARTERS;
    },

    getMapPresetOptions() {
      return MAP_PRESETS;
    },

    trackQuest(questId) {
      dispatch({ type: 'PATCH', payload: { quests: trackQuestState(state.quests, questId) } });
    },

    clearQuestToast() {
      dispatch({ type: 'PATCH', payload: { questToast: null } });
    },

    clearAchievementToast() {
      dispatch({ type: 'PATCH', payload: { achievementToast: null } });
    },

    dismissQuestPopup() {
      dispatch({ type: 'PATCH', payload: { questPopup: null } });
    },
  });
  }, [state]);

  useEffect(() => {
    if (!state.playerName) return;
    if (state.screen === SCREENS.BATTLE) return;
    const id = setTimeout(() => {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
      saveGame(state, state.activeSaveSlot || 1);
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
    }, 400);
    return () => clearTimeout(id);
  }, [
    state.playerName,
    state.team,
    state.storage,
    state.inventory,
    state.money,
    state.world,
    state.quests,
    state.reputation,
    state.achievements,
    state.worldSystems,
    state.daycare,
    state.profile,
    state.expeditions,
    state.pokedex,
    state.badges,
    state.tcg,
    state.settings,
    state.activeSaveSlot,
    state.screen,
  ]);

  return <GameContext.Provider value={{ state, actions }}>{children}</GameContext.Provider>;
}

export function useGameStore() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameStore must be used inside GameProvider');
  return ctx;
}
