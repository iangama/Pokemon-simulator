import { useMemo, useState } from 'react';
import { usePokemonData } from '../../hooks/usePokemonData';
import { ENCOUNTERS_BY_AREA } from '../../data/encounters';
import { AREAS } from '../../data/areas';
import { toTitle } from '../../utils/formatters';

function buildSpeciesRegionsIndex() {
  const bySpecies = new Map();
  for (const [areaId, encounters] of Object.entries(ENCOUNTERS_BY_AREA)) {
    const areaName = AREAS[areaId]?.name || areaId;
    for (const encounter of encounters) {
      const species = encounter.species;
      if (!bySpecies.has(species)) {
        bySpecies.set(species, new Set());
      }
      bySpecies.get(species).add(areaName);
    }
  }
  return bySpecies;
}

function getPokemonImage(entry, selectedDetail) {
  if (selectedDetail?.sprites?.other?.['official-artwork']?.front_default) {
    return selectedDetail.sprites.other['official-artwork'].front_default;
  }
  if (selectedDetail?.sprites?.front_default) {
    return selectedDetail.sprites.front_default;
  }
  return entry?.sample?.spriteFront || '';
}

export default function PokedexPanel({ pokedex, team, storage }) {
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedName, setSelectedName] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const { list, loading, loadOne } = usePokemonData(80, offset);

  const roster = useMemo(() => [...team, ...storage], [team, storage]);
  const speciesRegions = useMemo(() => buildSpeciesRegionsIndex(), []);

  const regionOptions = useMemo(() => {
    const regions = new Set();
    for (const regionSet of speciesRegions.values()) {
      for (const region of regionSet.values()) {
        regions.add(region);
      }
    }
    return Array.from(regions).sort((a, b) => a.localeCompare(b));
  }, [speciesRegions]);

  const entries = useMemo(() => {
    return list
      .map((resource) => resource.name)
      .filter((name) => name.includes(query.toLowerCase()))
      .map((name) => {
        const regionList = Array.from(speciesRegions.get(name) || []).sort((a, b) => a.localeCompare(b));
        return {
          name,
          seen: !!pokedex.seen[name],
          caught: !!pokedex.caught[name],
          sample: roster.find((r) => r.species === name),
          regions: regionList,
        };
      })
      .filter((entry) => (regionFilter === 'all' ? true : entry.regions.includes(regionFilter)))
      .slice(0, 80);
  }, [list, query, pokedex, roster, speciesRegions, regionFilter]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.name === selectedName) || null,
    [entries, selectedName]
  );
  const selectedImageUrl = useMemo(
    () => getPokemonImage(selectedEntry, selectedDetail),
    [selectedEntry, selectedDetail]
  );

  const stats = useMemo(() => {
    const uniqueOwned = new Set(roster.map((pokemon) => pokemon.species));
    return {
      ownedNow: roster.length,
      ownedUnique: uniqueOwned.size,
      caught: Object.keys(pokedex.caught || {}).length,
      seen: Object.keys(pokedex.seen || {}).length,
    };
  }, [roster, pokedex]);

  async function openPokemonImage(name) {
    setSelectedName(name);
    setDetailLoading(true);
    setDetailError('');
    try {
      const detail = await loadOne(name);
      setSelectedDetail(detail);
    } catch (error) {
      setSelectedDetail(null);
      setDetailError('Nao foi possivel carregar a imagem desse Pokemon.');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Pokedex</h2>

      <div className="mini-grid">
        <span className="list-row">No time + storage: {stats.ownedNow}</span>
        <span className="list-row">Especies em posse: {stats.ownedUnique}</span>
        <span className="list-row">Capturados: {stats.caught}</span>
        <span className="list-row">Vistos: {stats.seen}</span>
      </div>

      <div className="mini-grid pokedex-filters">
        <input
          placeholder="Buscar nome"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="all">Todas as regioes</option>
          {regionOptions.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      <div className="pokedex-layout">
        <div className="stack scroll-area">
          {entries.map((entry) => (
            <div key={entry.name} className="list-row pokedex-entry">
              <div>
                <strong>{toTitle(entry.name)}</strong>
                <div className="pokedex-entry-meta">
                  {entry.caught ? 'Captured' : entry.seen ? 'Seen' : '---'}
                </div>
                <div className="pokedex-entry-meta">
                  Regiao: {entry.regions.length ? entry.regions.join(', ') : 'Nao aparece nas areas atuais'}
                </div>
              </div>
              <button onClick={() => openPokemonImage(entry.name)}>Imagem</button>
            </div>
          ))}
        </div>

        <div className="pokedex-preview">
          <h3>Imagem do Pokemon</h3>
          {!selectedName && <p>Escolha um Pokemon para abrir a imagem.</p>}
          {selectedName && detailLoading && <p>Carregando imagem...</p>}
          {selectedName && !detailLoading && detailError && <p>{detailError}</p>}
          {selectedName && !detailLoading && !detailError && selectedEntry && (
            <>
              <p><strong>{toTitle(selectedName)}</strong></p>
              {selectedImageUrl ? (
                <img
                  className="pokedex-art"
                  src={selectedImageUrl}
                  alt={`Imagem de ${selectedName}`}
                />
              ) : (
                <p>Sem imagem disponivel para este Pokemon.</p>
              )}
              {selectedImageUrl && (
                <div className="mini-grid">
                  <a className="button-link" href={selectedImageUrl} target="_blank" rel="noreferrer">Abrir imagem</a>
                  <a className="button-link" href={selectedImageUrl} download={`${selectedName}.png`}>Baixar imagem</a>
                </div>
              )}
              <p className="pokedex-entry-meta">
                Regioes de encontro: {selectedEntry.regions.length ? selectedEntry.regions.join(', ') : 'Nao mapeadas'}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mini-grid">
        <button onClick={() => setOffset((prev) => Math.max(0, prev - 80))} disabled={offset === 0}>Prev</button>
        <button onClick={() => setOffset((prev) => prev + 80)}>Next</button>
        <span>{loading ? 'Loading...' : `Offset: ${offset}`}</span>
      </div>
    </div>
  );
}
