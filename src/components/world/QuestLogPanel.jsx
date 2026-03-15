import { QUESTS } from '../../data/quests';
import { REGION_LABELS } from '../../data/areas';
import { ACHIEVEMENTS } from '../../engine/achievementEngine';
import { getQuestProgressLine, rewardsLabel } from '../../engine/questEngine';

export default function QuestLogPanel({ quests, reputation = {}, achievements, onTrackQuest }) {
  const activeIds = Object.keys(quests?.active || {});
  const completedIds = Object.keys(quests?.completed || {});
  const achievementProgress = achievements?.progress || {};
  const achievementDone = achievements?.completed || {};

  return (
    <div className="panel quest-log">
      <h3>Quest Log</h3>

      <h4>Ativas</h4>
      {activeIds.length === 0 && <p>Nenhuma quest ativa.</p>}
      <div className="stack">
        {activeIds.map((questId) => {
          const quest = QUESTS[questId];
          const isTracked = quests?.trackedQuestId === questId;
          return (
            <div key={questId} className={`quest-card ${isTracked ? 'quest-tracked' : ''}`}>
              <strong>{quest?.name || questId}</strong>
              <div>{quest?.description}</div>
              <div className="quest-progress">Proximo passo: {getQuestProgressLine(quests, questId)}</div>
              <small>Recompensa: {rewardsLabel(quest?.rewards)}</small>
              <div className="mini-grid">
                <button onClick={() => onTrackQuest?.(questId)}>
                  {isTracked ? 'Quest rastreada' : 'Rastrear'}
                </button>
              </div>
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

      <h4>Reputacao por Regiao</h4>
      <div className="stack">
        {Object.entries(REGION_LABELS).map(([regionId, label]) => (
          <div key={regionId} className="list-row">
            <span>{label}</span>
            <strong>{reputation[regionId] || 0} pts</strong>
          </div>
        ))}
      </div>

      <h4>Conquistas</h4>
      <div className="stack">
        {Object.values(ACHIEVEMENTS).map((achievement) => {
          const current = achievementProgress[achievement.id] || 0;
          const done = !!achievementDone[achievement.id];
          return (
            <div key={achievement.id} className={`quest-card ${done ? 'quest-done' : ''}`}>
              <strong>{achievement.name}</strong>
              <div>{achievement.description}</div>
              <small>{current}/{achievement.target}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
