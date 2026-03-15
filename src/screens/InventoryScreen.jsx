import InventoryPanel from '../components/inventory/InventoryPanel';

export default function InventoryScreen({ state, actions }) {
  const lead = state.team[0];
  return (
    <div className="screen">
      <InventoryPanel inventory={state.inventory} onUse={(itemId) => lead && actions.useItem(itemId, lead.uid)} />
    </div>
  );
}
