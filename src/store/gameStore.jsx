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
import { AREA_MAPS, MAP_PRESETS, getMapPresetById, getTileAt, findExit } from '../data/areaMaps';
import { getItemEvolutionsForSpecies } from '../data/evolutionItems';
import { QUESTS, WORLD_NPCS } from '../data/quests';

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
  quests: {
    active: {},
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

function applyQuestRewards({ inventory, money }, rewards = {}) {
  let nextInventory = { ...inventory };
  let nextMoney = money + (rewards.money || 0);
  for (const [itemId, qty] of Object.entries(rewards.items || {})) {
    nextInventory = addItem(nextInventory, itemId, qty);
  }
  return { inventory: nextInventory, money: nextMoney };
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

  const actions = useMemo(() => ({
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
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...save,
          activeSaveSlot: slot,
          saveSlots: slots,
          inventory: ensureMinimumInventory(save.inventory),
          team: (save.team || []).map(normalizePokemonForBattle),
          storage: (save.storage || []).map(normalizePokemonForBattle),
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
          },
          team: [starter],
          pokedex: markCaught(markSeen(createPokedex(), starter.species), starter.species),
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
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...save,
          activeSaveSlot: state.activeSaveSlot || 1,
          saveSlots: listSaveSlots(),
          inventory: ensureMinimumInventory(save.inventory),
          team: (save.team || []).map(normalizePokemonForBattle),
          storage: (save.storage || []).map(normalizePokemonForBattle),
          screen: SCREENS.WORLD,
        },
      });
    },

    continueFromSlot(slot) {
      const save = loadGame(slot);
      if (!save) return false;
      dispatch({
        type: 'SET_STATE',
        payload: {
          ...save,
          activeSaveSlot: slot,
          saveSlots: listSaveSlots(),
          inventory: ensureMinimumInventory(save.inventory),
          team: (save.team || []).map(normalizePokemonForBattle),
          storage: (save.storage || []).map(normalizePokemonForBattle),
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
      if (!canTravel(state.world.areaId, nextAreaId, state.world.flags)) return;
      const spawn = AREA_MAPS[nextAreaId]?.spawn || { x: 1, y: 1 };
      const nextWorld = {
        ...state.world,
        areaId: nextAreaId,
        playerPos: { ...spawn },
        playerFacing: 'down',
        stepsInArea: 0,
      };
      dispatch({ type: 'PATCH', payload: { world: nextWorld } });
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
      saveGame({ ...state, world: nextWorld }, state.activeSaveSlot || 1);
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
    },

    async walkStep() {
      const area = AREAS[state.world.areaId];
      if (!area?.canEncounter) return;

      const steps = state.world.stepsInArea + 1;
      const newWorld = { ...state.world, stepsInArea: steps };
      dispatch({ type: 'PATCH', payload: { world: newWorld } });

      const preset = getMapPresetById(state.world.mapPreset);
      if (Math.random() > (preset.encounterRate || 0.16)) return;
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
      if (nextTile === '#') {
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
        if (!canTravel(areaId, exit.to, state.world.flags)) return;
        const nextWorld = {
          ...state.world,
          areaId: exit.to,
          playerPos: { ...(exit.spawn || AREA_MAPS[exit.to]?.spawn || { x: 1, y: 1 }) },
          playerFacing: direction,
          playerFrame: nextFrame,
          stepsInArea: 0,
        };
        dispatch({ type: 'PATCH', payload: { world: nextWorld } });
        return;
      }

      const nextWorld = {
        ...state.world,
        playerPos: nextPos,
        playerFacing: direction,
        playerFrame: nextFrame,
        stepsInArea: state.world.stepsInArea + 1,
      };
      dispatch({ type: 'PATCH', payload: { world: nextWorld } });

      const area = AREAS[areaId];
      if (!area?.canEncounter) return;

      const baseChance = getMapPresetById(state.world.mapPreset).encounterRate ?? 0.16;
      if (nextTile !== 'g') return;
      if (Math.random() > baseChance) return;

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

      const nextWorld = { ...state.world, npcFlags: { ...state.world.npcFlags } };
      const nextQuests = {
        active: { ...(state.quests.active || {}) },
        completed: { ...(state.quests.completed || {}) },
        log: [...(state.quests.log || [])],
      };
      let nextInventory = state.inventory;
      let nextMoney = state.money;
      let lines = [...(npc.dialogue || [`${npc.name}: ...`])];

      if (npc.questId && !nextQuests.active[npc.questId] && !nextQuests.completed[npc.questId]) {
        nextQuests.active[npc.questId] = true;
        const quest = QUESTS[npc.questId];
        lines.push(`Nova quest: ${quest?.name || npc.questId}`);
      }

      if (npc.questTrigger) {
        nextWorld.npcFlags[npc.questTrigger] = true;
      }

      for (const questId of Object.keys(nextQuests.active)) {
        const quest = QUESTS[questId];
        if (!quest) continue;

        let canComplete = false;
        if (quest.kind === 'interact') {
          canComplete = !!nextWorld.npcFlags[quest.triggerId];
        } else if (quest.kind === 'trainer-defeat') {
          canComplete = !!state.world.defeatedTrainers[quest.trainerId];
        }

        if (canComplete) {
          delete nextQuests.active[questId];
          nextQuests.completed[questId] = true;
          nextQuests.log.push(questId);
          const rewarded = applyQuestRewards({ inventory: nextInventory, money: nextMoney }, quest.rewards);
          nextInventory = rewarded.inventory;
          nextMoney = rewarded.money;
          lines.push(`Quest concluida: ${quest.name}`);
        }
      }

      dispatch({
        type: 'PATCH',
        payload: {
          world: nextWorld,
          quests: nextQuests,
          inventory: nextInventory,
          money: nextMoney,
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
      const trainerReward = TRAINERS[nextBattle.trainerId]?.rewardMoney || GYMS[nextBattle.trainerId]?.rewardMoney || 0;
      const reward = applyBattleRewards({
        playerTeam: nextBattle.playerTeam,
        defeatedPokemon: defeated,
        money: state.money,
        moneyReward: trainerReward,
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

      if (nextBattle.trainerId && TRAINERS[nextBattle.trainerId]) {
        nextDefeatedTrainers[nextBattle.trainerId] = true;
        if (!nextFlags.includes('FIRST_ROUTE_CLEAR')) nextFlags.push('FIRST_ROUTE_CLEAR');
      }

      if (isGym) {
        nextGymsDefeated[nextBattle.trainerId] = true;
        nextBadges = addBadge(nextBadges, GYMS[nextBattle.trainerId].badgeId);
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

      dispatch({
        type: 'PATCH',
        payload: {
          team: nextTeam,
          money: reward.money,
          world: {
            ...state.world,
            defeatedTrainers: nextDefeatedTrainers,
            gymsDefeated: nextGymsDefeated,
            flags: nextFlags,
          },
          badges: nextBadges,
          pendingLevelUp: reward.leveledUp ? nextTeam[0] : null,
          pendingEvolution: null,
          pendingMoveLearn,
          battleSummary: {
            result: 'win',
            title: 'Vitoria!',
            message: `${defeated?.name || 'Inimigo'} derrotado.`,
            xpTotal,
            moneyGained: trainerReward,
            xpToNextLevel: xpRemainingToNextLevel(nextTeam[0]),
          },
          tcg: { ...state.tcg, collection: nextCollection },
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

      dispatch({
        type: 'PATCH',
        payload: {
          inventory: nextInventory,
          team: nextTeam,
          storage: nextStorage,
          pokedex: markCaught(state.pokedex, target.species),
          battle: {
            ...battle,
            phase: 'ended',
            result: 'captured',
            log: [...battle.log.slice(-18), `${target.name} foi capturado!`],
          },
          pendingLevelUp: leveledUp ? nextTeam[0] : state.pendingLevelUp,
          pendingMoveLearn,
          captureSummary: {
            title: 'Pokemon Capturado!',
            species: target.name,
            level: target.level,
            capturedTo,
            xpGained: captureXp,
            xpToNextLevel: xpRemainingToNextLevel(nextTeam[0]),
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
      const cost = item.buyPrice * qty;
      const result = spendMoney(state.money, cost);
      if (!result.ok) return false;
      const nextInventory = addItem(state.inventory, itemId, qty);
      dispatch({ type: 'PATCH', payload: { money: result.money, inventory: nextInventory } });
      return true;
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
  }), [state]);

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
