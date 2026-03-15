import { useState } from 'react';
import BattleArena from '../components/battle/BattleArena';
import BattleHud from '../components/battle/BattleHud';
import BattleLog from '../components/battle/BattleLog';
import BattleActionMenu from '../components/battle/BattleActionMenu';
import MoveSelector from '../components/battle/MoveSelector';
import InventoryPanel from '../components/inventory/InventoryPanel';
import CaptureFeedback from '../components/battle/CaptureFeedback';

export default function BattleScreen({ state, actions }) {
  const [menu, setMenu] = useState('root');
  const [captureResult, setCaptureResult] = useState(null);
  const battle = state.battle;
  const battleSummary = state.battleSummary;
  const captureSummary = state.captureSummary;
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
        <BattleHud player={player} enemy={enemy} />
        <BattleArena player={player} enemy={enemy} />
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
                if (itemId === 'pokeball') {
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
