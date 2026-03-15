export default function MoveLearnModal({ pending, team = [], onLearn, onSkip }) {
  if (!pending) return null;
  const pokemon = team.find((member) => member.uid === pending.pokemonUid);
  if (!pokemon) return null;

  return (
    <div className="modal">
      <div className="panel" style={{ maxWidth: 560, width: 'calc(100% - 24px)' }}>
        <h3>{pending.pokemonName} quer aprender {pending.move.name}</h3>
        <p>Tipo: {pending.move.type} | Poder: {pending.move.power || '-'} | PP: {pending.move.pp}</p>

        {pokemon.moves.length < 4 ? (
          <div className="stack">
            <button onClick={() => onLearn(null)}>Aprender Golpe</button>
            <button onClick={onSkip}>Agora nao</button>
          </div>
        ) : (
          <>
            <p>Escolha um golpe para esquecer:</p>
            <div className="stack">
              {pokemon.moves.map((move, index) => (
                <button key={`${move.slug}-${index}`} onClick={() => onLearn(index)}>
                  Esquecer {move.name} ({move.type})
                </button>
              ))}
            </div>
            <button onClick={onSkip}>Nao aprender</button>
          </>
        )}
      </div>
    </div>
  );
}
