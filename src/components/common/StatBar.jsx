import { useEffect, useRef, useState } from 'react';

function toneByRatio(ratio) {
  if (ratio <= 0.25) return 'danger';
  if (ratio <= 0.55) return 'warn';
  return 'safe';
}

export default function StatBar({ value = 0, max = 1, label = '', flashOnDecrease = false }) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0));
  const ratio = safeValue / safeMax;
  const tone = toneByRatio(ratio);
  const previousValueRef = useRef(safeValue);
  const [flashDamage, setFlashDamage] = useState(false);

  useEffect(() => {
    const prev = previousValueRef.current;
    if (flashOnDecrease && safeValue < prev) {
      setFlashDamage(true);
      const id = setTimeout(() => setFlashDamage(false), 150);
      previousValueRef.current = safeValue;
      return () => clearTimeout(id);
    }
    previousValueRef.current = safeValue;
  }, [safeValue, flashOnDecrease]);

  return (
    <div className="statbar-wrap" aria-label={label}>
      <div className="statbar-track">
        <div
          className={`statbar-fill ${tone} ${flashDamage ? 'flash-damage' : ''}`}
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
