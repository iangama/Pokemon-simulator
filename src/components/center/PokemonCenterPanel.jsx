export default function PokemonCenterPanel({ onHeal, onSave }) {
  return (
    <div className="panel">
      <h2>Pokemon Center</h2>
      <button onClick={onHeal}>Heal Team</button>
      <button onClick={onSave}>Save Game</button>
    </div>
  );
}
