import { SCREENS } from '../utils/constants';

export default function TitleScreen({ onNavigate, saveSlots = [] }) {
  const hasSave = saveSlots.some((slot) => slot.exists);
  return (
    <div className="screen title-screen">
      <h1>Monsters Legacy</h1>
      <p>Retro-inspired browser RPG</p>
      <p>Save Slots: {saveSlots.filter((slot) => slot.exists).length}/3</p>
      <div className="stack narrow">
        <button onClick={() => onNavigate(SCREENS.NEW_GAME)}>New Game</button>
        <button onClick={() => onNavigate(SCREENS.CONTINUE_GAME)} disabled={!hasSave}>Continue</button>
        <button onClick={() => onNavigate(SCREENS.SETTINGS)}>Settings</button>
      </div>
    </div>
  );
}
