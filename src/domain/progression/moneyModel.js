export function rewardMoney(currentMoney, amount) {
  return currentMoney + amount;
}

export function spendMoney(currentMoney, amount) {
  if (currentMoney < amount) return { ok: false, money: currentMoney };
  return { ok: true, money: currentMoney - amount };
}
