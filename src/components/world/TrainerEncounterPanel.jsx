export default function TrainerEncounterPanel({ trainerName, reward }) {
  if (!trainerName) return null;
  return (
    <div className="panel trainer-encounter">
      <h3>{trainerName} challenged you!</h3>
      <p>Reward: ${reward}</p>
    </div>
  );
}
