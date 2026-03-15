import { randomFloat } from '../../utils/random';
import { getTypeMultiplier } from './typeEffectiveness';
import { clamp } from '../../utils/math';

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function calculateDamage({ attacker, defender, move }) {
  const isSpecial = move?.damageClass === 'special';
  const attackStat = isSpecial
    ? toNumber(attacker?.stats?.specialAttack, toNumber(attacker?.stats?.attack, 10))
    : toNumber(attacker?.stats?.attack, 10);
  const defenseStat = isSpecial
    ? toNumber(defender?.stats?.specialDefense, toNumber(defender?.stats?.defense, 10))
    : toNumber(defender?.stats?.defense, 10);
  const movePower = toNumber(move?.power, 40);
  const attackerLevel = toNumber(attacker?.level, 5);

  const core = (((2 * attackerLevel) / 5 + 2) * movePower * (attackStat / Math.max(1, defenseStat))) / 35 + 3;
  const levelDifference = attackerLevel - toNumber(defender?.level, 5);
  const levelMultiplier = clamp(1 + levelDifference * 0.06, 0.75, 1.55);
  const attackerTypes = Array.isArray(attacker?.types) ? attacker.types : [];
  const defenderTypes = Array.isArray(defender?.types) ? defender.types : [];
  const moveType = move?.type || 'normal';
  const stabMultiplier = attackerTypes.includes(moveType) ? 1.2 : 1;
  const typeMultiplier = getTypeMultiplier(moveType, defenderTypes);
  const randomFactor = randomFloat(0.92, 1);

  const finalDamage = Math.max(
    2,
    Math.floor(core * levelMultiplier * stabMultiplier * typeMultiplier * randomFactor)
  );

  return {
    amount: Number.isFinite(finalDamage) ? finalDamage : 2,
    levelMultiplier,
    stabMultiplier,
    typeMultiplier,
  };
}

function hasAbility(pokemon, abilityName) {
  return (pokemon?.abilities || []).includes(abilityName);
}

function abilityDamageModifier(attacker, defender, moveType) {
  if (moveType === 'ground' && hasAbility(defender, 'levitate')) return 0;
  if (moveType === 'water' && hasAbility(defender, 'water-absorb')) return 0;
  if (moveType === 'fire' && hasAbility(defender, 'flash-fire')) return 0;

  const hpRatio = (attacker?.currentHp || 1) / Math.max(1, attacker?.stats?.hp || 1);
  if (hpRatio <= 0.33) {
    if (moveType === 'fire' && hasAbility(attacker, 'blaze')) return 1.2;
    if (moveType === 'grass' && hasAbility(attacker, 'overgrow')) return 1.2;
    if (moveType === 'water' && hasAbility(attacker, 'torrent')) return 1.2;
  }
  return 1;
}

export function calculateCombatDamage({
  attacker,
  defender,
  move,
  attackerBuffs = { attack: 1, defense: 1 },
  defenderBuffs = { attack: 1, defense: 1 },
}) {
  const base = calculateDamage({ attacker, defender, move });
  const atkBuff = move?.damageClass === 'special' ? 1 : (attackerBuffs.attack || 1);
  const defBuff = move?.damageClass === 'special' ? 1 : (defenderBuffs.defense || 1);
  const crit = Math.random() < 0.1 ? 1.5 : 1;
  const abilityMod = abilityDamageModifier(attacker, defender, move?.type || 'normal');

  const amount = Math.max(2, Math.floor((base.amount * atkBuff * crit * abilityMod) / Math.max(0.5, defBuff)));

  return {
    ...base,
    amount,
    critMultiplier: crit,
    abilityMultiplier: abilityMod,
  };
}
