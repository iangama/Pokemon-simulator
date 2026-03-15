import { useGameStore } from '../store/gameStore';

export function useSaveSystem() {
  const { state, actions } = useGameStore();
  return {
    saveStatus: state.saveStatus,
    manualSave: actions.manualSave,
  };
}
