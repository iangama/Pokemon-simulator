export default function EvolutionModal({ evolution, onClose }) {
  if (!evolution) return null;
  return (
    <div className="modal">
      <div className="panel">
        <h3>Evolution!</h3>
        <p>{evolution.from} evolved into {evolution.to}.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
