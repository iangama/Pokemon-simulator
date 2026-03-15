export default function AreaTransition({ from, to }) {
  if (!from || !to || from === to) return null;
  return <div className="area-transition">Traveling from {from} to {to}...</div>;
}
