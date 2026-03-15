import { SAVE_KEY } from '../utils/constants';
import { writeLocalJson, readLocalJson, removeLocalKey } from '../utils/storage';
import { serializeSave } from '../domain/saves/saveSerializer';
import { validateSave } from '../domain/saves/saveValidator';

function slotKey(slot = 1) {
  return `${SAVE_KEY}-slot-${slot}`;
}

export function saveGame(state, slot = 1) {
  const serialized = serializeSave(state);
  writeLocalJson(slotKey(slot), serialized);
  return serialized;
}

export function loadGame(slot = 1) {
  const save = readLocalJson(slotKey(slot), null);
  const check = validateSave(save);
  if (!check.valid) return null;
  return save;
}

export function clearSave(slot = 1) {
  removeLocalKey(slotKey(slot));
}

export function listSaveSlots() {
  const slots = [];
  for (let slot = 1; slot <= 3; slot += 1) {
    const save = readLocalJson(slotKey(slot), null);
    slots.push({
      slot,
      exists: !!save?.playerName,
      playerName: save?.playerName || null,
      updatedAt: save?.updatedAt || null,
    });
  }
  return slots;
}

export function exportSave(slot = 1) {
  const save = loadGame(slot);
  return save ? JSON.stringify(save, null, 2) : '';
}

export function importSave(raw, slot = 1) {
  try {
    const parsed = JSON.parse(raw);
    const check = validateSave(parsed);
    if (!check.valid) return { ok: false, reason: check.reason };
    writeLocalJson(slotKey(slot), parsed);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: String(error.message || error) };
  }
}
