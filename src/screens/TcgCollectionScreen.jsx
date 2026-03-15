import { useEffect } from 'react';
import TcgCollectionPanel from '../components/tcg/TcgCollectionPanel';

export default function TcgCollectionScreen({ state, actions }) {
  useEffect(() => {
    actions.refreshTcgSets();
  }, []);

  return (
    <div className="screen">
      <TcgCollectionPanel collection={state.tcg.collection} sets={state.tcg.sets} />
    </div>
  );
}
