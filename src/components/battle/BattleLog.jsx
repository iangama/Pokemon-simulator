export default function BattleLog({ entries = [] }) {
  return (
    <div className="battle-log">
      {entries.slice(-6).map((line, index) => (
        <div key={`${line}-${index}`}>{line}</div>
      ))}
    </div>
  );
}
