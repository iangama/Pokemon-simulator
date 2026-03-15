import { ITEMS } from '../../data/items';

export default function InventoryPanel({ inventory, onUse, inBattle = false }) {
  return (
    <div className="panel">
      <h2>Inventory</h2>
      <div className="stack">
        {Object.entries(inventory).map(([itemId, qty]) => (
          <div key={itemId} className="list-row">
            <span>{ITEMS[itemId]?.name || itemId}</span>
            <span>x{qty}</span>
            {qty > 0 && ITEMS[itemId]?.kind !== 'evolution' && (
              <button onClick={() => onUse(itemId)}>{inBattle ? 'Use' : 'Use on Lead'}</button>
            )}
            {qty > 0 && ITEMS[itemId]?.kind === 'evolution' && <span>Use in Team</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
