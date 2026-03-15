export default function GymPanel({ gym, onChallenge, defeated }) {
  return (
    <div className="panel">
      <h2>{gym.leaderName} - {gym.title}</h2>
      <p>Badge: {gym.badgeId}</p>
      <p>Reward: ${gym.rewardMoney}</p>
      <button onClick={onChallenge} disabled={defeated}>{defeated ? 'Already Defeated' : 'Challenge'}</button>
    </div>
  );
}
