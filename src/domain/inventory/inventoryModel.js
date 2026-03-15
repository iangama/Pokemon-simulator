export function createInitialInventory() {
  return {
    pokeball: 10,
    potion: 12,
    superPotion: 4,
    revive: 3,
    antidote: 3,
    xAttack: 2,
    guardSpec: 2,
    fullHeal: 2,
    fireStone: 0,
    waterStone: 0,
    thunderStone: 0,
    leafStone: 0,
    moonStone: 0,
  };
}

export function addItem(inventory, itemId, amount = 1) {
  return { ...inventory, [itemId]: (inventory[itemId] || 0) + amount };
}

export function consumeItem(inventory, itemId, amount = 1) {
  const current = inventory[itemId] || 0;
  if (current < amount) return inventory;
  return { ...inventory, [itemId]: current - amount };
}
