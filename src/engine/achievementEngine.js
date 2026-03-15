export const ACHIEVEMENTS = {
  firstCapture: {
    id: 'firstCapture',
    name: 'Primeira Captura',
    description: 'Capture seu primeiro Pokemon.',
    kind: 'capture-total',
    target: 1,
  },
  rookieCollector: {
    id: 'rookieCollector',
    name: 'Colecionador Iniciante',
    description: 'Capture 10 Pokemon no total.',
    kind: 'capture-total',
    target: 10,
  },
  routeChampion: {
    id: 'routeChampion',
    name: 'Treinador de Rota',
    description: 'Derrote 5 treinadores.',
    kind: 'trainer-defeat-total',
    target: 5,
  },
  worldExplorer: {
    id: 'worldExplorer',
    name: 'Explorador',
    description: 'Descubra 8 areas diferentes.',
    kind: 'discover-area-total',
    target: 8,
  },
  questCadet: {
    id: 'questCadet',
    name: 'Cadete de Missoes',
    description: 'Conclua 5 quests.',
    kind: 'quest-complete-total',
    target: 5,
  },
};

function blankProgressMap() {
  const map = {};
  for (const id of Object.keys(ACHIEVEMENTS)) {
    map[id] = 0;
  }
  return map;
}

export function createAchievementState() {
  return {
    progress: blankProgressMap(),
    completed: {},
    log: [],
  };
}

export function normalizeAchievementState(raw) {
  const base = createAchievementState();
  const next = {
    progress: { ...base.progress, ...(raw?.progress || {}) },
    completed: { ...(raw?.completed || {}) },
    log: [...(raw?.log || [])],
  };

  for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
    const value = Number(next.progress[id] || 0);
    next.progress[id] = Math.max(0, Math.min(ach.target, value));
    if (next.progress[id] >= ach.target) {
      next.completed[id] = true;
      if (!next.log.includes(id)) next.log.push(id);
    }
  }

  for (const id of Object.keys(next.completed)) {
    if (!ACHIEVEMENTS[id]) delete next.completed[id];
  }

  return next;
}

export function resolveAchievementEvent({ achievements, event }) {
  const next = normalizeAchievementState(achievements);
  const unlockedIds = [];

  function addProgress(kind, value = 1) {
    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
      if (ach.kind !== kind || next.completed[id]) continue;
      const before = next.progress[id] || 0;
      const after = Math.min(ach.target, before + value);
      next.progress[id] = after;
      if (after >= ach.target) {
        next.completed[id] = true;
        if (!next.log.includes(id)) next.log.push(id);
        unlockedIds.push(id);
      }
    }
  }

  if (event?.type === 'capture') addProgress('capture-total', 1);
  if (event?.type === 'defeat-trainer') addProgress('trainer-defeat-total', 1);
  if (event?.type === 'discover-area') addProgress('discover-area-total', 1);
  if (event?.type === 'complete-quest') addProgress('quest-complete-total', 1);

  return {
    achievements: next,
    unlockedIds,
    toast: unlockedIds.length ? `Conquista desbloqueada: ${ACHIEVEMENTS[unlockedIds[0]].name}` : null,
  };
}
