import { toTitle } from '../../utils/formatters';

export default function StarterPicker({ starters, onPick }) {
  return (
    <div className="starter-grid">
      {starters.map((starter) => (
        <button key={starter.name} onClick={() => onPick(starter.name)} className="starter-card">
          <div className="starter-id">#{starter.id}</div>
          <div>{toTitle(starter.name)}</div>
        </button>
      ))}
    </div>
  );
}
