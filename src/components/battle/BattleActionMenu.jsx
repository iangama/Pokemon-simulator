export default function BattleActionMenu({ onFight, onBag, onPokemon, onRun }) {
  return (
    <div className="battle-actions">
      <button onClick={onFight}>Fight</button>
      <button onClick={onBag}>Bag</button>
      <button onClick={onPokemon}>Pokemon</button>
      <button onClick={onRun}>Run</button>
    </div>
  );
}
