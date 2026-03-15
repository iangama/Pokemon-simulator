import { MAX_TEAM_SIZE } from '../../utils/constants';

export function canAddToTeam(team) {
  return team.length < MAX_TEAM_SIZE;
}

export function addPokemonToTeam(team, pokemon) {
  if (!canAddToTeam(team)) return team;
  return [...team, pokemon];
}

export function replaceTeamMember(team, uid, nextPokemon) {
  return team.map((member) => (member.uid === uid ? nextPokemon : member));
}

export function healTeam(team) {
  return team.map((member) => ({ ...member, currentHp: member.stats.hp, fainted: false }));
}
