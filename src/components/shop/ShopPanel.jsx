import { SHOP_CATALOG } from '../../data/shopCatalog';
import { ITEMS } from '../../data/items';

export default function ShopPanel({ money, onBuy }) {
  return (
    <div className="panel">
      <h2>Shop</h2>
      <p>Money: ${money}</p>
      <div className="stack">
        {SHOP_CATALOG.map((itemId) => (
          <div key={itemId} className="list-row">
            <span>{ITEMS[itemId].name}</span>
            <span>${ITEMS[itemId].buyPrice}</span>
            <button onClick={() => onBuy(itemId)}>Buy</button>
          </div>
        ))}
      </div>
    </div>
  );
}
