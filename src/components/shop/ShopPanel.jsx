import { ITEMS } from '../../data/items';

export default function ShopPanel({ money, stock = [], discount = 1, dailyEventName = 'Dia comum', onBuy }) {
  return (
    <div className="panel">
      <h2>Shop</h2>
      <p>Money: ${money}</p>
      <p>Evento do dia: {dailyEventName} {discount !== 1 ? `(desconto ${Math.round((1 - discount) * 100)}%)` : ''}</p>
      <div className="stack">
        {stock.map((itemId) => (
          <div key={itemId} className="list-row">
            <span>{ITEMS[itemId]?.name || itemId}</span>
            <span>${Math.floor((ITEMS[itemId]?.buyPrice || 0) * discount)}</span>
            <button onClick={() => onBuy(itemId)}>Buy</button>
          </div>
        ))}
      </div>
    </div>
  );
}
