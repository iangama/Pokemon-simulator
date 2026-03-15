import { calculateCombatDamage } from './damageCalculator';
import { appendBattleLog } from './battleLog';

function cloneTeam(team) {
  return team.map((member) => ({ ...member, stats: { ...member.stats }, moves: member.moves.map((m) => ({ ...m })) }));
}

function applyDamage(target, amount) {
  const safeAmount = Number.isFinite(amount) ? amount : 2;
  const currentHp = Number.isFinite(target.currentHp) ? target.currentHp : target.stats.hp;
  const boundedDamage = Math.max(0, Math.min(currentHp, safeAmount));
  const hp = Math.max(0, currentHp - boundedDamage);
  return { ...target, currentHp: hp, fainted: hp <= 0 };
}

function consumeMovePp(pokemon, move) {
  const moves = (pokemon.moves || []).map((entry) => ({ ...entry }));
  const idx = moves.findIndex((entry) => entry.id === move.id || entry.slug === move.slug || entry.name === move.name);
  if (idx >= 0) {
    const current = Number.isFinite(moves[idx].currentPp) ? moves[idx].currentPp : moves[idx].pp || 0;
    moves[idx].currentPp = Math.max(0, current - 1);
  }
  return { ...pokemon, moves };
}

function canActByStatus(pokemon) {
  if (!pokemon.status) return { canAct: true };
  if (pokemon.status === 'sleep') return { canAct: false, reason: 'sleep' };
  if (pokemon.status === 'paralyze' && Math.random() < 0.25) return { canAct: false, reason: 'paralyze' };
  if (pokemon.status === 'freeze') {
    if (Math.random() < 0.2) return { canAct: true, thawed: true };
    return { canAct: false, reason: 'freeze' };
  }
  return { canAct: true };
}

function applyEndTurnStatusDamage(pokemon) {
  if (pokemon.fainted) return pokemon;
  if (!pokemon.status) return pokemon;
  if (pokemon.status !== 'burn' && pokemon.status !== 'poison') return pokemon;

  const maxHp = Math.max(1, pokemon.stats.hp);
  const tick = Math.max(1, Math.floor(maxHp * 0.08));
  const hp = Math.max(0, pokemon.currentHp - tick);
  return { ...pokemon, currentHp: hp, fainted: hp <= 0 };
}

function shouldApplyStatus(moveType, defender) {
  if (defender.status) return null;
  if (moveType === 'fire' && Math.random() < 0.12) return 'burn';
  if (moveType === 'poison' && Math.random() < 0.16) return 'poison';
  if (moveType === 'electric' && Math.random() < 0.1) return 'paralyze';
  if (moveType === 'ice' && Math.random() < 0.08) return 'freeze';
  return null;
}

function hitSuccess(move) {
  const acc = Number.isFinite(move?.accuracy) ? move.accuracy : 100;
  return Math.random() * 100 <= acc;
}

function firstAliveIndex(team) {
  return team.findIndex((member) => !member.fainted && member.currentHp > 0);
}

function switchIfNeeded(next, side) {
  const isPlayer = side === 'player';
  const team = isPlayer ? next.playerTeam : next.enemyTeam;
  const activeIndex = isPlayer ? next.playerActiveIndex : next.enemyActiveIndex;
  const active = team[activeIndex];

  if (active && !active.fainted && active.currentHp > 0) return next;

  const candidate = firstAliveIndex(team);
  if (candidate >= 0 && candidate !== activeIndex) {
    if (isPlayer) {
      next.playerActiveIndex = candidate;
      next = appendBattleLog(next, `${next.playerTeam[candidate].name} entrou na batalha!`);
    } else {
      next.enemyActiveIndex = candidate;
      next = appendBattleLog(next, `${next.enemyTeam[candidate].name} entrou na batalha!`);
    }
  } else if (candidate < 0) {
    next.phase = 'ended';
    next.result = isPlayer ? 'lose' : 'win';
    next = appendBattleLog(
      next,
      isPlayer ? 'Seu time nao tem mais Pokemon para lutar.' : 'O oponente nao tem mais Pokemon para lutar.'
    );
  }

  return next;
}

export function resolveTurn(state, playerMove, enemyMove) {
  let next = { ...state, playerTeam: cloneTeam(state.playerTeam), enemyTeam: cloneTeam(state.enemyTeam) };
  next = switchIfNeeded(next, 'player');
  next = switchIfNeeded(next, 'enemy');

  const earlyPlayerDefeated = next.playerTeam.every((m) => m.fainted || m.currentHp <= 0);
  const earlyEnemyDefeated = next.enemyTeam.every((m) => m.fainted || m.currentHp <= 0);
  if (earlyPlayerDefeated || earlyEnemyDefeated) {
    next.phase = 'ended';
    next.result = earlyPlayerDefeated ? 'lose' : 'win';
    return next;
  }

  let player = next.playerTeam[next.playerActiveIndex];
  let enemy = next.enemyTeam[next.enemyActiveIndex];
  if (!player || !enemy) {
    next.phase = 'ended';
    next.result = player ? 'win' : 'lose';
    return next;
  }

  const playerFirst = (player.stats.speed || 1) >= (enemy.stats.speed || 1);
  const sequence = playerFirst
    ? [
        { attackerSide: 'player', move: playerMove },
        { attackerSide: 'enemy', move: enemyMove },
      ]
    : [
        { attackerSide: 'enemy', move: enemyMove },
        { attackerSide: 'player', move: playerMove },
      ];

  for (const step of sequence) {
    const attackerSide = step.attackerSide;
    const defenderSide = attackerSide === 'player' ? 'enemy' : 'player';
    const attacker = attackerSide === 'player'
      ? next.playerTeam[next.playerActiveIndex]
      : next.enemyTeam[next.enemyActiveIndex];
    const defender = defenderSide === 'player'
      ? next.playerTeam[next.playerActiveIndex]
      : next.enemyTeam[next.enemyActiveIndex];

    if (!attacker || !defender) continue;
    if (attacker.fainted || defender.fainted) continue;

    const actCheck = canActByStatus(attacker);
    if (actCheck.thawed) {
      const thawed = { ...attacker, status: null };
      if (attackerSide === 'player') next.playerTeam[next.playerActiveIndex] = thawed;
      else next.enemyTeam[next.enemyActiveIndex] = thawed;
    }
    if (!actCheck.canAct) {
      const reason = actCheck.reason === 'sleep'
        ? `${attacker.name} esta dormindo.`
        : actCheck.reason === 'paralyze'
          ? `${attacker.name} esta paralisado e nao conseguiu agir.`
          : `${attacker.name} esta congelado.`;
      next = appendBattleLog(next, reason);
      continue;
    }

    const attackerAfterPp = consumeMovePp(attacker, step.move);
    if (attackerSide === 'player') {
      next.playerTeam[next.playerActiveIndex] = attackerAfterPp;
    } else {
      next.enemyTeam[next.enemyActiveIndex] = attackerAfterPp;
    }

    if (!hitSuccess(step.move)) {
      next = appendBattleLog(next, `${attacker.name} errou ${step.move.name}.`);
      continue;
    }

    const attackerBuffs = attackerSide === 'player' ? next.playerBuffs : next.enemyBuffs;
    const defenderBuffs = defenderSide === 'player' ? next.playerBuffs : next.enemyBuffs;
    const dmg = calculateCombatDamage({
      attacker: attackerAfterPp,
      defender,
      move: step.move,
      attackerBuffs,
      defenderBuffs,
    });
    const damagedDefender = applyDamage(defender, dmg.amount);

    if (defenderSide === 'player') {
      next.playerTeam[next.playerActiveIndex] = damagedDefender;
    } else {
      next.enemyTeam[next.enemyActiveIndex] = damagedDefender;
    }

    next = appendBattleLog(next, `${attacker.name} usou ${step.move.name} e causou ${dmg.amount} de dano.`);
    if (dmg.critMultiplier > 1) next = appendBattleLog(next, 'Acerto critico!');
    if (dmg.typeMultiplier > 1) next = appendBattleLog(next, 'Foi super efetivo!');
    if (dmg.typeMultiplier < 1 && dmg.typeMultiplier > 0) next = appendBattleLog(next, 'Nao foi muito efetivo...');
    if (dmg.typeMultiplier === 0) next = appendBattleLog(next, 'Nao teve efeito.');

    const statusToApply = shouldApplyStatus(step.move.type, damagedDefender);
    if (statusToApply && !damagedDefender.fainted) {
      const statusApplied = { ...damagedDefender, status: statusToApply };
      if (defenderSide === 'player') next.playerTeam[next.playerActiveIndex] = statusApplied;
      else next.enemyTeam[next.enemyActiveIndex] = statusApplied;
      next = appendBattleLog(next, `${statusApplied.name} ficou com ${statusToApply}.`);
    }

    if (damagedDefender.fainted) {
      next = appendBattleLog(next, `${damagedDefender.name} desmaiou.`);
      next = switchIfNeeded(next, defenderSide);
      if (next.phase === 'ended') {
        return next;
      }
    }
  }

  const afterStatusPlayer = applyEndTurnStatusDamage(next.playerTeam[next.playerActiveIndex]);
  const afterStatusEnemy = applyEndTurnStatusDamage(next.enemyTeam[next.enemyActiveIndex]);
  next.playerTeam[next.playerActiveIndex] = afterStatusPlayer;
  next.enemyTeam[next.enemyActiveIndex] = afterStatusEnemy;
  if (afterStatusPlayer.fainted) {
    next = appendBattleLog(next, `${afterStatusPlayer.name} desmaiou por status.`);
    next = switchIfNeeded(next, 'player');
  }
  if (afterStatusEnemy.fainted) {
    next = appendBattleLog(next, `${afterStatusEnemy.name} desmaiou por status.`);
    next = switchIfNeeded(next, 'enemy');
  }

  const playerDefeated = next.playerTeam.every((m) => m.fainted || m.currentHp <= 0);
  const enemyDefeated = next.enemyTeam.every((m) => m.fainted || m.currentHp <= 0);

  if (playerDefeated || enemyDefeated) {
    next.phase = 'ended';
    next.result = playerDefeated ? 'lose' : 'win';
  }

  return next;
}
