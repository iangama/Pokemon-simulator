import { useEffect } from 'react';

export function useGameLoop(tick, intervalMs = 3000, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      tick();
    }, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs, enabled]);
}
