export default function SaveStatusIndicator({ status }) {
  const map = {
    idle: 'Idle',
    saving: 'Saving...',
    saved: 'Saved',
  };
  return <div className="save-indicator">Save: {map[status] || status}</div>;
}
