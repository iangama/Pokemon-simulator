import ShopPanel from '../components/shop/ShopPanel';

export default function ShopScreen({ state, actions }) {
  return (
    <div className="screen">
      <ShopPanel money={state.money} onBuy={(itemId) => actions.buyItem(itemId, 1)} />
    </div>
  );
}
