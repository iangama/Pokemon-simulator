import { useState } from 'react';

export default function NewGameForm({ onSubmit }) {
  const [name, setName] = useState('');

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
    >
      <h3>New Adventure</h3>
      <label>
        Trainer Name
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={16} />
      </label>
      <button type="submit">Continue</button>
    </form>
  );
}
