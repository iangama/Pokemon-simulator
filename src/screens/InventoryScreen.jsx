import InventoryPanel from '../components/inventory/InventoryPanel';
import { CRAFTING_RECIPES, NPC_TRADE_OFFERS } from '../data/worldSystems';

function costLabel(cost = {}) {
  return Object.entries(cost).map(([itemId, qty]) => `${itemId} x${qty}`).join(' | ');
}

function outputLabel(output = {}) {
  return Object.entries(output).map(([itemId, qty]) => `${itemId} x${qty}`).join(' | ');
}

export default function InventoryScreen({ state, actions }) {
  const lead = state.team[0];
  const areaId = state.world.areaId;
  const localTrades = NPC_TRADE_OFFERS.filter((offer) => offer.location === areaId);

  return (
    <div className="screen stack">
      <InventoryPanel inventory={state.inventory} onUse={(itemId) => lead && actions.useItem(itemId, lead.uid)} />

      <div className="panel">
        <h3>Crafting</h3>
        <div className="stack">
          {CRAFTING_RECIPES.map((recipe) => (
            <div key={recipe.id} className="list-row">
              <span>
                <strong>{recipe.name}</strong><br />
                Custo: {costLabel(recipe.cost)}<br />
                Saida: {outputLabel(recipe.output)}
              </span>
              <button onClick={() => actions.craftItem(recipe.id)}>Craft</button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Fishing</h3>
        <div className="mini-grid">
          <button onClick={() => actions.fishEncounter('oldRod')} disabled={(state.inventory.oldRod || 0) <= 0}>Usar Old Rod</button>
          <button onClick={() => actions.fishEncounter('goodRod')} disabled={(state.inventory.goodRod || 0) <= 0}>Usar Good Rod</button>
        </div>
      </div>

      <div className="panel">
        <h3>NPC Trade Market ({areaId})</h3>
        <div className="stack">
          {localTrades.map((offer) => (
            <div key={offer.id} className="list-row">
              <span>
                <strong>{offer.npc}</strong><br />
                Quer: {offer.wants} (Lv {offer.minLevel}+)<br />
                Entrega: {offer.gives}
              </span>
              <button
                onClick={() => actions.tradeWithNpc(offer.id)}
                disabled={offer.once && !!state.worldSystems?.tradeCompleted?.[offer.id]}
              >
                {offer.once && !!state.worldSystems?.tradeCompleted?.[offer.id] ? 'Concluida' : 'Trocar'}
              </button>
            </div>
          ))}
          {!localTrades.length && <span className="list-row">Nenhuma troca disponivel nessa area.</span>}
        </div>
      </div>
    </div>
  );
}
