import { createContext, useContext, useState } from 'react';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [uiState, setUiState] = useState({
    dialogue: '',
    modal: null,
  });

  return <UiContext.Provider value={{ uiState, setUiState }}>{children}</UiContext.Provider>;
}

export function useUiStore() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUiStore must be used inside UiProvider');
  return ctx;
}
