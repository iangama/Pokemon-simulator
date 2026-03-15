import { createContext, useContext, useState } from 'react';

const SaveContext = createContext(null);

export function SaveProvider({ children }) {
  const [saveStatus, setSaveStatus] = useState('idle');
  return <SaveContext.Provider value={{ saveStatus, setSaveStatus }}>{children}</SaveContext.Provider>;
}

export function useSaveStore() {
  const ctx = useContext(SaveContext);
  if (!ctx) throw new Error('useSaveStore must be used inside SaveProvider');
  return ctx;
}
