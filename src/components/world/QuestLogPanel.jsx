import { QUESTS } from '../../data/quests';

function rewardsLabel(rewards = {}) {
  const parts = [];
  if (rewards.money) parts.push(`$${rewards.money}`);
  for (const [itemId, qty] of Object.entries(rewards.items || {})) {
    parts.push(`${itemId} x${qty}`);
  }
  return parts.join(' | ');
}

function progressLabel(quest, world) {
  if (!quest) return 'Sem progresso';
  if (quest.kind === 'interact') {
    return world?.npcFlags?.[quest.triggerId] ? 'Objetivo cumprido, fale com o NPC da quest.' : 'Entregar/interagir pendente.';
  }
  if (quest.kind === 'trainer-defeat') {
    return world?.defeatedTrainers?.[quest.trainerId] ? 'Treinador derrotado, volte ao NPC.' : 'Treinador alvo ainda nao derrotado.';
  }
  return 'Em andamento';
}

export default function QuestLogPanel({ quests, world }) {
  const activeIds = Object.keys(quests?.active || {});
  const completedIds = Object.keys(quests?.completed || {});

  return (
    <div className="panel quest-log">
      <h3>Quest Log</h3>

      <h4>Ativas</h4>
      {activeIds.length === 0 && <p>Nenhuma quest ativa.</p>}
      <div className="stack">
        {activeIds.map((questId) => {
          const quest = QUESTS[questId];
          return (
            <div key={questId} className="quest-card">
              <strong>{quest?.name || questId}</strong>
              <div>{quest?.description}</div>
              <div className="quest-progress">{progressLabel(quest, world)}</div>
              <small>Recompensa: {rewardsLabel(quest?.rewards)}</small>
            </div>
          );
        })}
      </div>

      <h4>Concluidas</h4>
      {completedIds.length === 0 && <p>Nenhuma quest concluida ainda.</p>}
      <div className="stack">
        {completedIds.map((questId) => (
          <div key={questId} className="quest-card quest-done">
            <strong>{QUESTS[questId]?.name || questId}</strong>
            <small>Concluida</small>
          </div>
        ))}
      </div>
    </div>
  );
}
