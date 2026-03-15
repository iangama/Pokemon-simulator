import StoragePanel from '../components/storage/StoragePanel';

export default function StorageScreen({ state, actions }) {
  return (
    <div className="screen">
      <StoragePanel
        team={state.team}
        storage={state.storage}
        onToStorage={actions.moveTeamToStorage}
        onToTeam={actions.moveStorageToTeam}
      />
    </div>
  );
}
