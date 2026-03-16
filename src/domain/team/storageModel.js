export function addPokemonToStorage(storage, pokemon) {
  return [...storage, pokemon];
}

export function moveFromStorageToTeam({ storage, team, uid }) {
  const target = storage.find((p) => p.uid === uid);
  if (!target) return { storage, team };
  return {
    storage: storage.filter((p) => p.uid !== uid),
    team: [...team, target],
  };
}

export function moveFromTeamToStorage({ storage, team, uid }) {
  const target = team.find((p) => p.uid === uid);
  if (!target) return { storage, team };
  return {
    storage: [...storage, target],
    team: team.filter((p) => p.uid !== uid),
  };
}

export function swapStorageWithTeam({ storage, team, storageUid, teamUid }) {
  const incoming = storage.find((p) => p.uid === storageUid);
  const outgoing = team.find((p) => p.uid === teamUid);
  if (!incoming || !outgoing) return { storage, team };

  return {
    storage: [...storage.filter((p) => p.uid !== storageUid), outgoing],
    team: team.map((p) => (p.uid === teamUid ? incoming : p)),
  };
}
