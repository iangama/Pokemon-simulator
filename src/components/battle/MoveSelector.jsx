import StatBar from '../common/StatBar';

export default function MoveSelector({ moves = [], onSelect }) {
  return (
    <div className="move-selector">
      {moves.map((move, index) => (
        <button
          key={move.id}
          onClick={() => onSelect(index)}
          disabled={(move.currentPp ?? move.pp ?? 0) <= 0}
        >
          <div><strong>{move.name}</strong> ({move.type})</div>
          <div>Energia: {move.currentPp ?? move.pp ?? 0}/{move.pp ?? 0} | Custo: 1 PP</div>
          <StatBar
            value={Math.max(0, move.currentPp ?? move.pp ?? 0)}
            max={move.pp ?? 1}
            label={`${move.name} PP`}
          />
        </button>
      ))}
    </div>
  );
}
