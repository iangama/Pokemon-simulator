import ShopPanel from '../components/shop/ShopPanel';
import { DAILY_WORLD_EVENTS } from '../data/worldSystems';
import { SHOP_CATALOG } from '../data/shopCatalog';

export default function ShopScreen({ state, actions }) {
  const event = DAILY_WORLD_EVENTS.find((entry) => entry.id === state.worldSystems?.dailyEventId) || DAILY_WORLD_EVENTS[0];
  const discount = event?.shopDiscount || 1;
  const stock = state.worldSystems?.shopStock?.length ? state.worldSystems.shopStock : SHOP_CATALOG;

  return (
    <div className="screen">
      <ShopPanel
        money={state.money}
        stock={stock}
        discount={discount}
        dailyEventName={event?.name || 'Dia comum'}
        onBuy={(itemId) => actions.buyItem(itemId, 1)}
      />
    </div>
  );
}
