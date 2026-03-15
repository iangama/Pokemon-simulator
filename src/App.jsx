import { useEffect, useState } from 'react';
import './styles.css';
import { GameProvider, useGameStore } from './store/gameStore';
import { UiProvider } from './store/uiStore';
import { SaveProvider } from './store/saveStore';
import { SCREENS } from './utils/constants';

import TitleScreen from './screens/TitleScreen';
import NewGameScreen from './screens/NewGameScreen';
import ContinueGameScreen from './screens/ContinueGameScreen';
import WorldScreen from './screens/WorldScreen';
import BattleScreen from './screens/BattleScreen';
import TeamScreen from './screens/TeamScreen';
import PokedexScreen from './screens/PokedexScreen';
import InventoryScreen from './screens/InventoryScreen';
import StorageScreen from './screens/StorageScreen';
import ShopScreen from './screens/ShopScreen';
import PokemonCenterScreen from './screens/PokemonCenterScreen';
import GymScreen from './screens/GymScreen';
import TcgCollectionScreen from './screens/TcgCollectionScreen';
import SettingsScreen from './screens/SettingsScreen';

import SaveStatusIndicator from './components/common/SaveStatusIndicator';
import DialogueBox from './components/dialogue/DialogueBox';
import EvolutionModal from './components/battle/EvolutionModal';
import LevelUpModal from './components/battle/LevelUpModal';
import AreaTransition from './components/world/AreaTransition';
import MoveLearnModal from './components/team/MoveLearnModal';

function GameShell() {
  const { state, actions } = useGameStore();
  const [lastArea, setLastArea] = useState(state.world.areaId);

  useEffect(() => {
    actions.bootstrap();
  }, []);

  useEffect(() => {
    if (state.world.areaId !== lastArea) {
      setLastArea(state.world.areaId);
    }
  }, [state.world.areaId, lastArea]);

  const navVisible = ![SCREENS.TITLE, SCREENS.NEW_GAME, SCREENS.CONTINUE_GAME].includes(state.screen);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Monsters Legacy</div>
        <SaveStatusIndicator status={state.saveStatus} />
      </header>

      {navVisible && (
        <nav className="menu-bar">
          <button onClick={() => actions.setScreen(SCREENS.WORLD)}>World</button>
          <button onClick={() => actions.setScreen(SCREENS.TEAM)}>Team</button>
          <button onClick={() => actions.setScreen(SCREENS.INVENTORY)}>Bag</button>
          <button onClick={() => actions.setScreen(SCREENS.POKEDEX)}>Pokedex</button>
          <button onClick={() => actions.setScreen(SCREENS.STORAGE)}>Storage</button>
          <button onClick={() => actions.setScreen(SCREENS.SHOP)}>Shop</button>
          <button onClick={() => actions.setScreen(SCREENS.CENTER)}>Center</button>
          <button onClick={() => actions.setScreen(SCREENS.GYM)}>Gym</button>
          <button onClick={() => actions.setScreen(SCREENS.TCG)}>TCG</button>
          <button onClick={() => actions.setScreen(SCREENS.SETTINGS)}>Settings</button>
        </nav>
      )}

      <main>
        {state.screen === SCREENS.TITLE && (
          <TitleScreen onNavigate={actions.setScreen} saveSlots={state.saveSlots || []} />
        )}
        {state.screen === SCREENS.NEW_GAME && (
          <NewGameScreen
            saveSlots={state.saveSlots || []}
            activeSaveSlot={state.activeSaveSlot || 1}
            onSelectSlot={actions.setActiveSaveSlot}
            starters={actions.getStarterOptions()}
            mapPresets={actions.getMapPresetOptions()}
            onStart={actions.newGame}
          />
        )}
        {state.screen === SCREENS.CONTINUE_GAME && (
          <ContinueGameScreen
            activeSlot={state.activeSaveSlot || 1}
            saveSlots={state.saveSlots || []}
            onSelectSlot={actions.setActiveSaveSlot}
            onContinue={actions.continueFromSlot}
            onNewGame={() => actions.setScreen(SCREENS.NEW_GAME)}
          />
        )}
        {state.screen === SCREENS.WORLD && <WorldScreen state={state} actions={actions} />}
        {state.screen === SCREENS.BATTLE && <BattleScreen state={state} actions={actions} />}
        {state.screen === SCREENS.TEAM && <TeamScreen state={state} actions={actions} />}
        {state.screen === SCREENS.POKEDEX && <PokedexScreen state={state} actions={actions} />}
        {state.screen === SCREENS.INVENTORY && <InventoryScreen state={state} actions={actions} />}
        {state.screen === SCREENS.STORAGE && <StorageScreen state={state} actions={actions} />}
        {state.screen === SCREENS.SHOP && <ShopScreen state={state} actions={actions} />}
        {state.screen === SCREENS.CENTER && <PokemonCenterScreen state={state} actions={actions} />}
        {state.screen === SCREENS.GYM && <GymScreen state={state} actions={actions} />}
        {state.screen === SCREENS.TCG && <TcgCollectionScreen state={state} actions={actions} />}
        {state.screen === SCREENS.SETTINGS && <SettingsScreen state={state} actions={actions} />}
      </main>

      <DialogueBox text={state.error} />
      <AreaTransition from={lastArea} to={state.world.areaId} />
      <LevelUpModal pokemon={state.pendingLevelUp} onClose={actions.clearPopups} />
      <EvolutionModal evolution={state.pendingEvolution} onClose={actions.clearPopups} />
      <MoveLearnModal
        pending={state.pendingMoveLearn}
        team={state.team}
        onLearn={actions.learnPendingMove}
        onSkip={actions.skipPendingMove}
      />
    </div>
  );
}

export default function App() {
  return (
    <SaveProvider>
      <UiProvider>
        <GameProvider>
          <GameShell />
        </GameProvider>
      </UiProvider>
    </SaveProvider>
  );
}
