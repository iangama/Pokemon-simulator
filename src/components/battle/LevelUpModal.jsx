export default function LevelUpModal({ pokemon, onClose }) {
  if (!pokemon) return null;
  return (
    <div className="modal">
      <div className="panel">
        <h3>Level Up!</h3>
        <p>{pokemon.name} reached Lv {pokemon.level}.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
