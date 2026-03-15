export default function ContinueGameScreen({ onContinue, onNewGame, saveSlots = [], activeSlot = 1, onSelectSlot }) {
  const selected = saveSlots.find((slot) => slot.slot === activeSlot);

  return (
    <div className="screen">
      <div className="panel">
        <h2>Continue Adventure</h2>
        <div className="stack">
          {saveSlots.map((slot) => (
            <button key={slot.slot} onClick={() => onSelectSlot?.(slot.slot)}>
              Slot {slot.slot}: {slot.exists ? `${slot.playerName} (${slot.updatedAt || 'sem data'})` : 'vazio'}
            </button>
          ))}
        </div>
        <button onClick={() => onContinue(activeSlot)} disabled={!selected?.exists}>Enter World</button>
        <button onClick={onNewGame}>New Game</button>
      </div>
    </div>
  );
}
