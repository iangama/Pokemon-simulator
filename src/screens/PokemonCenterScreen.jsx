import PokemonCenterPanel from '../components/center/PokemonCenterPanel';

export default function PokemonCenterScreen({ actions }) {
  return (
    <div className="screen">
      <PokemonCenterPanel onHeal={actions.healAtCenter} onSave={actions.manualSave} />
    </div>
  );
}
