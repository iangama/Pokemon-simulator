import GymPanel from '../components/gym/GymPanel';
import { GYMS } from '../data/gyms';

export default function GymScreen({ state, actions }) {
  const gym = Object.values(GYMS).find((entry) => entry.areaId === state.world.areaId) || GYMS['verdant-gym'];
  const defeated = !!state.world.gymsDefeated[gym.id];

  return (
    <div className="screen">
      <GymPanel gym={gym} defeated={defeated} onChallenge={() => actions.challengeGym(gym.id)} />
    </div>
  );
}
