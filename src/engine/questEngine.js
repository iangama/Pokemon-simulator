import { QUESTS, WORLD_NPCS } from '../data/quests';

const WORLD_NPCS_FLAT = Object.entries(WORLD_NPCS).flatMap(([areaId, npcs]) =>
  (npcs || []).map((npc) => ({ ...npc, areaId }))
);

function canStartQuest(quest, quests) {
  if (!quest) return false;
  if (quests.active?.[quest.id]) return false;
  if (quests.completed?.[quest.id]) return false;

  const prerequisites = quest.prerequisites || [];
  return prerequisites.every((questId) => quests.completed?.[questId]);
}

function buildQuestProgress(quest) {
  const objectiveProgress = {};
  for (const objective of quest.objectives || []) {
    objectiveProgress[objective.id] = 0;
  }
  return {
    questId: quest.id,
    objectiveProgress,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function targetByObjectiveType(objective, event, currentProgress) {
  if (!objective || !event) return currentProgress;
  const target = objective.target || 1;
  const current = currentProgress || 0;

  if (objective.type === 'talk-npc') {
    if (event.type !== 'talk-npc' || event.npcId !== objective.npcId) return current;
    return Math.max(current, target);
  }

  if (objective.type === 'enter-area') {
    if (event.type !== 'enter-area' || event.areaId !== objective.areaId) return current;
    return Math.max(current, target);
  }

  if (objective.type === 'capture-count') {
    if (event.type !== 'capture') return current;
    if (objective.areaId && event.areaId !== objective.areaId) return current;
    return Math.min(target, current + 1);
  }

  if (objective.type === 'defeat-trainer-count') {
    if (event.type !== 'defeat-trainer') return current;
    if (objective.areaId && event.areaId !== objective.areaId) return current;
    if (objective.allowedTrainerIds?.length && !objective.allowedTrainerIds.includes(event.trainerId)) return current;
    return Math.min(target, current + 1);
  }

  return current;
}

function objectiveIsComplete(objective, progressValue) {
  return (progressValue || 0) >= (objective.target || 1);
}

function allObjectivesComplete(quest, questProgress) {
  return (quest.objectives || []).every((objective) =>
    objectiveIsComplete(objective, questProgress.objectiveProgress?.[objective.id])
  );
}

function findTrackedFallback(quests) {
  const activeIds = Object.keys(quests.active || {});
  if (activeIds.length === 0) return null;

  const main = activeIds.find((id) => QUESTS[id]?.isMain);
  return main || activeIds[0];
}

function ensureTrackedQuest(quests) {
  const tracked = quests.trackedQuestId;
  if (tracked && quests.active?.[tracked]) {
    return quests;
  }
  return {
    ...quests,
    trackedQuestId: findTrackedFallback(quests),
  };
}

function cloneQuests(quests) {
  return {
    active: { ...(quests.active || {}) },
    completed: { ...(quests.completed || {}) },
    log: [...(quests.log || [])],
    trackedQuestId: quests.trackedQuestId || null,
  };
}

function tryStartQuest(next, questId, startedQuestIds) {
  const quest = QUESTS[questId];
  if (!canStartQuest(quest, next)) return false;
  next.active[questId] = buildQuestProgress(quest);
  startedQuestIds.push(questId);
  return true;
}

function startAutoQuests(next, startedQuestIds) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const quest of Object.values(QUESTS)) {
      if (!quest.autoStart) continue;
      if (tryStartQuest(next, quest.id, startedQuestIds)) changed = true;
    }
  }
}

function findNpcAreaId(npcId) {
  return WORLD_NPCS_FLAT.find((npc) => npc.id === npcId)?.areaId || null;
}

function findNpcEntry(npcId) {
  return WORLD_NPCS_FLAT.find((npc) => npc.id === npcId) || null;
}

function firstIncompleteObjective(quest, progress) {
  return (quest.objectives || []).find(
    (objective) => !objectiveIsComplete(objective, progress?.objectiveProgress?.[objective.id])
  ) || null;
}

export function createQuestState() {
  const seed = {
    active: {},
    completed: {},
    log: [],
    trackedQuestId: null,
  };
  const startedQuestIds = [];
  for (const quest of Object.values(QUESTS)) {
    if (quest.isStarter && !quest.autoStart) {
      // Starter quest appears as available marker on NPC and starts when player talks.
      continue;
    }
    if (quest.isStarter && quest.autoStart) {
      tryStartQuest(seed, quest.id, startedQuestIds);
    }
  }
  return ensureTrackedQuest(seed);
}

export function normalizeQuestState(raw) {
  const next = cloneQuests(raw || {});
  next.active = next.active || {};
  next.completed = next.completed || {};
  next.log = next.log || [];

  for (const [questId, progress] of Object.entries(next.active)) {
    const quest = QUESTS[questId];
    if (!quest) {
      delete next.active[questId];
      continue;
    }
    const normalized = buildQuestProgress(quest);
    for (const objective of quest.objectives || []) {
      normalized.objectiveProgress[objective.id] = Number(progress?.objectiveProgress?.[objective.id] || 0);
    }
    normalized.startedAt = progress?.startedAt || normalized.startedAt;
    normalized.updatedAt = progress?.updatedAt || normalized.updatedAt;
    next.active[questId] = normalized;
  }

  for (const questId of Object.keys(next.completed)) {
    if (!QUESTS[questId]) delete next.completed[questId];
  }

  if (Object.keys(next.active).length === 0 && Object.keys(next.completed).length === 0) {
    return createQuestState();
  }

  startAutoQuests(next, []);
  return ensureTrackedQuest(next);
}

export function resolveQuestEvent({ quests, event }) {
  const next = cloneQuests(quests);
  const startedQuestIds = [];
  const progressToasts = [];
  const completedQuestIds = [];

  if (event?.type === 'talk-npc') {
    for (const quest of Object.values(QUESTS)) {
      if (quest.giverNpcId !== event.npcId) continue;
      if (tryStartQuest(next, quest.id, startedQuestIds)) {
        progressToasts.push(`Nova quest: ${quest.name}`);
      }
    }
  }

  for (const questId of Object.keys(next.active)) {
    const quest = QUESTS[questId];
    const progress = next.active[questId];
    if (!quest || !progress) continue;

    let changed = false;
    for (const objective of quest.objectives || []) {
      const before = progress.objectiveProgress?.[objective.id] || 0;
      const after = targetByObjectiveType(objective, event, before);
      if (after !== before) {
        progress.objectiveProgress[objective.id] = after;
        progress.updatedAt = Date.now();
        changed = true;
        progressToasts.push(`Quest atualizada: ${quest.name} (${after}/${objective.target || 1})`);
      }
    }

    const objectivesDone = allObjectivesComplete(quest, progress);
    if (!objectivesDone) continue;

    const needsTurnIn = !!quest.turnInNpcId;
    const isTurnInEvent = event?.type === 'talk-npc' && event.npcId === quest.turnInNpcId;
    if (needsTurnIn && !isTurnInEvent) continue;

    delete next.active[questId];
    next.completed[questId] = true;
    if (!next.log.includes(questId)) next.log.push(questId);
    completedQuestIds.push(questId);
    progressToasts.push(`Quest concluida: ${quest.name}`);

    if (quest.nextQuestId) {
      tryStartQuest(next, quest.nextQuestId, startedQuestIds);
    }

    if (changed && quest.turnInNpcId && !isTurnInEvent) {
      progressToasts.push(`Volte para ${quest.turnInNpcName || 'o NPC'} para concluir.`);
    }
  }

  startAutoQuests(next, startedQuestIds);
  const normalized = ensureTrackedQuest(next);

  return {
    quests: normalized,
    startedQuestIds,
    completedQuestIds,
    progressToasts,
  };
}

export function trackQuest(quests, questId) {
  if (!questId || !quests.active?.[questId]) return quests;
  return { ...quests, trackedQuestId: questId };
}

export function getTrackedQuest(quests) {
  const questId = quests?.trackedQuestId;
  if (questId && quests?.active?.[questId]) {
    return QUESTS[questId] || null;
  }
  const fallback = findTrackedFallback(quests || {});
  return fallback ? QUESTS[fallback] || null : null;
}

export function getQuestProgressLine(quests, questId) {
  const quest = QUESTS[questId];
  const progress = quests?.active?.[questId];
  if (!quest || !progress) return 'Sem progresso.';

  const objective = firstIncompleteObjective(quest, progress);
  if (!objective) {
    if (quest.turnInNpcId) return 'Objetivo concluido. Fale com o NPC para entregar.';
    return 'Quest pronta para concluir.';
  }

  const value = progress.objectiveProgress?.[objective.id] || 0;
  return `${objective.label} (${value}/${objective.target || 1})`;
}

export function getTrackedQuestGuidance(quests) {
  const quest = getTrackedQuest(quests);
  if (!quest) {
    const availableMain = Object.values(QUESTS).find(
      (candidate) => candidate.isMain && canStartQuest(candidate, quests || {})
    );
    if (!availableMain) return null;
    const firstObjective = availableMain.objectives?.[0];
    return {
      questId: availableMain.id,
      questName: availableMain.name,
      objectiveText: firstObjective?.label || availableMain.description,
      targetAreaId: firstObjective?.areaId || findNpcAreaId(availableMain.giverNpcId),
      hint: availableMain.simpleHint || availableMain.description,
    };
  }

  const progress = quests.active?.[quest.id];
  const objective = firstIncompleteObjective(quest, progress);
  if (objective) {
    return {
      questId: quest.id,
      questName: quest.name,
      objectiveText: objective.label,
      targetAreaId: objective.areaId || findNpcAreaId(objective.npcId),
      hint: quest.simpleHint || quest.description,
    };
  }

  return {
    questId: quest.id,
    questName: quest.name,
    objectiveText: quest.turnInNpcId
      ? `Volte e fale com ${quest.turnInNpcName || 'o NPC da quest'}.`
      : 'Quest pronta para finalizar.',
    targetAreaId: quest.turnInAreaId || findNpcAreaId(quest.turnInNpcId),
    hint: quest.simpleHint || quest.description,
  };
}

export function getTrackedQuestTargetNpc(quests) {
  const quest = getTrackedQuest(quests);
  if (!quest) return null;

  const progress = quests?.active?.[quest.id];
  const objective = firstIncompleteObjective(quest, progress);
  if (objective?.type === 'talk-npc' && objective.npcId) {
    return findNpcEntry(objective.npcId);
  }

  const objectivesDone = allObjectivesComplete(quest, progress);
  if (objectivesDone && quest.turnInNpcId) {
    return findNpcEntry(quest.turnInNpcId);
  }
  return null;
}

export function getNpcQuestMarker({ npcId, quests }) {
  if (!npcId) return null;

  for (const questId of Object.keys(quests?.active || {})) {
    const quest = QUESTS[questId];
    const progress = quests.active[questId];
    if (!quest || !progress) continue;

    const objective = firstIncompleteObjective(quest, progress);
    if (objective?.type === 'talk-npc' && objective.npcId === npcId) {
      return 'turnin';
    }

    const isReadyToTurnIn = allObjectivesComplete(quest, progress);
    if (isReadyToTurnIn && quest.turnInNpcId === npcId) {
      return 'turnin';
    }
  }

  for (const quest of Object.values(QUESTS)) {
    if (quest.giverNpcId !== npcId) continue;
    if (canStartQuest(quest, quests)) return 'available';
  }

  return null;
}

export function getQuestByFlagUnlock(flag) {
  if (!flag) return null;
  for (const quest of Object.values(QUESTS)) {
    if ((quest.rewards?.flags || []).includes(flag)) return quest;
  }
  return null;
}

export function rewardsLabel(rewards = {}) {
  const parts = [];
  if (rewards.money) parts.push(`$${rewards.money}`);
  if (rewards.teamXp) parts.push(`Team XP +${rewards.teamXp}`);
  if (rewards.leadXp) parts.push(`Lead XP +${rewards.leadXp}`);
  for (const [itemId, qty] of Object.entries(rewards.items || {})) {
    parts.push(`${itemId} x${qty}`);
  }
  if ((rewards.flags || []).length) {
    parts.push((rewards.flags || []).join(', '));
  }
  return parts.join(' | ');
}
