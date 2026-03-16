import { useEffect } from 'react';
import TeamPanel from '../components/team/TeamPanel';

export default function TeamScreen({ state, actions }) {
  useEffect(() => {
    actions.refreshEvolutionReadiness?.();
  }, [state.team]);

  return (
    <div className="screen">
      <TeamPanel
        team={state.team}
        inventory={state.inventory}
        storage={state.storage}
        daycare={state.daycare}
        onUseItem={(itemId, uid) => actions.useItem(itemId, uid)}
        onEvolve={(uid) => actions.evolvePokemon(uid)}
        onEvolveWithItem={(uid, itemId) => actions.evolvePokemonWithItem(uid, itemId)}
        getItemEvolutions={(uid) => actions.getItemEvolutions(uid)}
        onDepositDaycare={(uid) => actions.depositDaycare(uid)}
        onWithdrawDaycare={(uid) => actions.withdrawDaycare(uid)}
        onHatchEgg={(eggId) => actions.hatchEgg(eggId)}
        onTrainWithPokemon={(targetUid, sourceUid) => actions.trainWithPokemon(targetUid, sourceUid)}
      />
    </div>
  );
}
