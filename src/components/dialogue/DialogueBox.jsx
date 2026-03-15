export default function DialogueBox({ text }) {
  if (!text) return null;
  return <div className="dialogue-box">{text}</div>;
}
