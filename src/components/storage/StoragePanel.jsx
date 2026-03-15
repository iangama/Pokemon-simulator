export default function StoragePanel({ team, storage, onToStorage, onToTeam }) {
  return (
    <div className="panel two-col">
      <div>
        <h3>Team</h3>
        {team.map((p) => (
          <div key={p.uid} className="list-row">
            <span>{p.name}</span>
            <button onClick={() => onToStorage(p.uid)}>Send</button>
          </div>
        ))}
      </div>
      <div>
        <h3>Storage</h3>
        {storage.map((p) => (
          <div key={p.uid} className="list-row">
            <span>{p.name}</span>
            <button onClick={() => onToTeam(p.uid)}>Take</button>
          </div>
        ))}
      </div>
    </div>
  );
}
