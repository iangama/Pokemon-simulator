import PokedexPanel from '../components/pokedex/PokedexPanel';

export default function PokedexScreen({ state }) {
  return (
    <div className="screen">
      <PokedexPanel pokedex={state.pokedex} team={state.team} storage={state.storage} />
    </div>
  );
}
