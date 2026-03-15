export default function TcgCollectionPanel({ collection, sets }) {
  const cards = Object.values(collection || {});
  return (
    <div className="panel two-col">
      <div>
        <h3>Collected Cards ({cards.length})</h3>
        <div className="card-grid">
          {cards.map((card) => (
            <div key={card.id} className="tcg-card">
              {card.images?.small && <img src={card.images.small} alt={card.name} />}
              <div>{card.name}</div>
              <small>{card.rarity || 'Unknown rarity'}</small>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3>TCGdex Sets</h3>
        <div className="stack scroll-area">
          {(sets || []).slice(0, 80).map((set) => (
            <div key={set.id} className="list-row">
              <span>{set.name}</span>
              <span>{set.cardCount?.total || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
