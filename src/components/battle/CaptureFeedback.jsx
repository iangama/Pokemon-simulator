export default function CaptureFeedback({ result }) {
  if (result == null) return null;
  return <div className="capture-feedback">{result ? 'Capture succeeded!' : 'Capture failed!'}</div>;
}
