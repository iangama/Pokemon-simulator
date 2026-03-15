import { useMemo, useState } from 'react';
import { usePokemonData } from '../../hooks/usePokemonData';

export default function PokedexPanel({ pokedex, team, storage }) {
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const { list, loading } = usePokemonData(80, offset);

  const entries = useMemo(() => {
    const roster = [...team, ...storage];
    return list
      .map((resource) => resource.name)
      .filter((name) => name.includes(query.toLowerCase()))
      .slice(0, 80)
      .map((name) => ({
        name,
        seen: !!pokedex.seen[name],
        caught: !!pokedex.caught[name],
        sample: roster.find((r) => r.species === name),
      }));
  }, [pokedex, team, storage, query, list]);

  return (
    <div className="panel">
      <h2>Pokedex</h2>
      <input placeholder="Search name" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="stack scroll-area">
        {entries.map((entry) => (
          <div key={entry.name} className="list-row">
            <span>{entry.name}</span>
            <span>{entry.caught ? 'Caught' : entry.seen ? 'Seen' : '---'}</span>
          </div>
        ))}
      </div>
      <div className="mini-grid">
        <button onClick={() => setOffset((prev) => Math.max(0, prev - 80))} disabled={offset === 0}>Prev</button>
        <button onClick={() => setOffset((prev) => prev + 80)}>Next</button>
        <span>{loading ? 'Loading...' : `Offset: ${offset}`}</span>
      </div>
    </div>
  );
}
