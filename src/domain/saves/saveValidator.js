export function validateSave(save) {
  if (!save || typeof save !== 'object') return { valid: false, reason: 'Save ausente' };
  if (!save.playerName) return { valid: false, reason: 'Nome do jogador ausente' };
  if (!Array.isArray(save.team)) return { valid: false, reason: 'Time invalido' };
  if (!save.pokedex || !save.inventory) return { valid: false, reason: 'Dados principais ausentes' };
  return { valid: true };
}
