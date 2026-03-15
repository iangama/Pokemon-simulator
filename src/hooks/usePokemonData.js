import { useEffect, useState } from 'react';
import { fetchPokemonPage, fetchPokemonByNameOrId } from '../api/pokeapi';

export function usePokemonData(limit = 60, offset = 0) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPokemonPage(limit, offset)
      .then((response) => {
        if (!mounted) return;
        setList(response.results || []);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [limit, offset]);

  async function loadOne(idOrName) {
    return fetchPokemonByNameOrId(idOrName);
  }

  return { list, loading, loadOne };
}
