import { useEffect, useRef, useState } from 'react';
import BattleArena from '../components/battle/BattleArena';
import BattleHud from '../components/battle/BattleHud';
import BattleLog from '../components/battle/BattleLog';
import BattleActionMenu from '../components/battle/BattleActionMenu';
import MoveSelector from '../components/battle/MoveSelector';
import InventoryPanel from '../components/inventory/InventoryPanel';
import CaptureFeedback from '../components/battle/CaptureFeedback';
import { ITEMS } from '../data/items';

const DEFAULT_FX = {
  playerClass: '',
  enemyClass: '',
  playerHudClass: '',
  enemyHudClass: '',
  projectile: null,
};

function extractAttackEvents(lines, battle) {
  if (!battle) return [];
  const playerNames = new Set((battle.playerTeam || []).map((member) => member.name));
  const enemyNames = new Set((battle.enemyTeam || []).map((member) => member.name));
  const attacks = [];
  const regex = /^(.+?) usou (.+?) e causou (\d+) de dano\.$/;
  for (const line of lines) {
    const match = line.match(regex);
    if (!match) continue;
    const attackerName = match[1];
    const moveName = match[2];
    const side = playerNames.has(attackerName) ? 'player' : enemyNames.has(attackerName) ? 'enemy' : null;
    if (!side) continue;
    const team = side === 'player' ? battle.playerTeam : battle.enemyTeam;
    const moveType = team
      .flatMap((member) => member.moves || [])
      .find((move) => move?.name === moveName)?.type || 'normal';
    attacks.push({ side, moveType });
  }
  return attacks;
}

export default function BattleScreen({ state, actions }) {
  const [menu, setMenu] = useState('root');
  const [captureResult, setCaptureResult] = useState(null);
  const [fx, setFx] = useState(DEFAULT_FX);
  const timersRef = useRef([]);
  const logCursorRef = useRef(0);
  const battle = state.battle;
  const battleSummary = state.battleSummary;
  const captureSummary = state.captureSummary;

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!battle) {
      logCursorRef.current = 0;
      setFx(DEFAULT_FX);
      return;
    }
    const log = battle.log || [];
    if (log.length < logCursorRef.current) logCursorRef.current = 0;
    const newLines = log.slice(logCursorRef.current);
    logCursorRef.current = log.length;
    const attacks = extractAttackEvents(newLines, battle);
    if (!attacks.length) return;

    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current = [];

    attacks.forEach((attack, index) => {
      const startDelay = index * 520;
      const clearDelay = startDelay + 420;
      const startId = setTimeout(() => {
        const isPlayer = attack.side === 'player';
        const hitClass = `battle-hit battle-flash type-${attack.moveType}`;
        setFx({
          playerClass: `${isPlayer ? 'battle-attack-player' : hitClass}`.trim(),
          enemyClass: `${isPlayer ? hitClass : 'battle-attack-enemy'}`.trim(),
          playerHudClass: !isPlayer ? hitClass : '',
          enemyHudClass: isPlayer ? hitClass : '',
          projectile: {
            from: attack.side,
            type: attack.moveType,
          },
        });
      }, startDelay);
      const clearId = setTimeout(() => setFx(DEFAULT_FX), clearDelay);
      timersRef.current.push(startId, clearId);
    });
  }, [battle]);

  if (!battle && !battleSummary && !captureSummary) return null;

  if (!battle && (battleSummary || captureSummary)) {
    return (
      <div className="screen">
        <div className="panel">
          {battleSummary && (
            <>
              <h3>{battleSummary.title}</h3>
              <p>{battleSummary.message}</p>
              <p>XP ganho: {battleSummary.xpTotal}</p>
              <p>Dinheiro: ${battleSummary.moneyGained}</p>
              <p>Faltam {battleSummary.xpToNextLevel ?? 0} XP para upar</p>
            </>
          )}
          {captureSummary && (
            <>
              <h3>{captureSummary.title}</h3>
              <p>{captureSummary.species} Lv{captureSummary.level}</p>
              <p>Enviado para: {captureSummary.capturedTo}</p>
              <p>XP ganho: {captureSummary.xpGained}</p>
              <p>Faltam {captureSummary.xpToNextLevel ?? 0} XP para upar</p>
            </>
          )}
          <button onClick={actions.finalizeBattleFlow}>Continuar</button>
        </div>
      </div>
    );
  }

  const player = battle.playerTeam[battle.playerActiveIndex];
  const enemy = battle.enemyTeam[battle.enemyActiveIndex];

  return (
    <div className="screen">
      <div className="panel battle-panel">
        <BattleHud
          player={player}
          enemy={enemy}
          playerAnimClass={fx.playerHudClass}
          enemyAnimClass={fx.enemyHudClass}
        />
        <BattleArena
          player={player}
          enemy={enemy}
          playerAnimClass={fx.playerClass}
          enemyAnimClass={fx.enemyClass}
          projectile={fx.projectile}
        />
        <BattleLog entries={battle.log} />
        <CaptureFeedback result={captureResult} />

        {menu === 'root' && (
          <BattleActionMenu
            onFight={() => setMenu('fight')}
            onBag={() => setMenu('bag')}
            onPokemon={() => setMenu('pokemon')}
            onRun={() => {
              const ran = actions.runFromBattle();
              if (!ran) setCaptureResult(false);
            }}
          />
        )}

        {menu === 'fight' && (
          <>
            <MoveSelector
              moves={player.moves}
              onSelect={(index) => {
                actions.battleTurn(index);
                setMenu('root');
              }}
            />
            <button onClick={() => setMenu('root')}>Back</button>
          </>
        )}

        {menu === 'bag' && (
          <>
            <InventoryPanel
              inventory={state.inventory}
              inBattle
              onUse={async (itemId) => {
                if (ITEMS[itemId]?.kind === 'ball') {
                  const result = await actions.tryCapture(itemId);
                  setCaptureResult(result);
                } else {
                  const used = actions.useBattleItem(itemId);
                  if (!used) setCaptureResult(false);
                }
                setMenu('root');
              }}
            />
            <button onClick={() => setMenu('root')}>Back</button>
          </>
        )}

        {menu === 'pokemon' && (
          <>
            <div className="stack">
              {battle.playerTeam.map((member, idx) => (
                <button
                  key={member.uid}
                  disabled={member.fainted || member.currentHp <= 0 || idx === battle.playerActiveIndex}
                  onClick={() => {
                    const switched = actions.switchBattlePokemon(member.uid);
                    if (switched) setMenu('root');
                  }}
                >
                  {member.name} Lv{member.level} HP {member.currentHp}/{member.stats.hp}
                  {member.status ? ` (${member.status})` : ''}
                </button>
              ))}
            </div>
            <button onClick={() => setMenu('root')}>Back</button>
          </>
        )}

        {battle.phase === 'ended' && (
          <div className="panel" style={{ marginTop: '0.5rem' }}>
            {battleSummary && (
              <>
                <h3>{battleSummary.title}</h3>
                <p>{battleSummary.message}</p>
                <p>XP ganho: {battleSummary.xpTotal}</p>
                <p>Dinheiro: ${battleSummary.moneyGained}</p>
                <p>Faltam {battleSummary.xpToNextLevel ?? 0} XP para upar</p>
              </>
            )}
            {captureSummary && (
              <>
                <h3>{captureSummary.title}</h3>
                <p>{captureSummary.species} Lv{captureSummary.level}</p>
                <p>Enviado para: {captureSummary.capturedTo}</p>
                <p>XP ganho: {captureSummary.xpGained}</p>
                <p>Faltam {captureSummary.xpToNextLevel ?? 0} XP para upar</p>
              </>
            )}
            <button onClick={actions.finalizeBattleFlow}>Continuar</button>
          </div>
        )}
      </div>
    </div>
  );
}
