import { useState } from 'react';

type Props = {
  value: number;
  onCommit: (minutes: number) => void;
};

const PRESETS = [10, 15, 20, 25];

/** Round time: quick presets plus an "Other" box for any number of minutes. */
export default function MinutesPicker({ value, onCommit }: Props) {
  const isCustom = !PRESETS.includes(value);
  const [showOther, setShowOther] = useState(false);
  const [other, setOther] = useState('');

  function saveOther() {
    const n = Math.round(Number(other));
    if (n >= 1 && n <= 240) {
      onCommit(n);
      setShowOther(false);
      setOther('');
    }
  }

  return (
    <>
      <div className="minute-chips">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            className={`select-chip ${value === m && !showOther ? 'selected' : ''}`}
            onClick={() => {
              setShowOther(false);
              if (m !== value) onCommit(m);
            }}
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          className={`select-chip ${isCustom || showOther ? 'selected' : ''}`}
          onClick={() => setShowOther((v) => !v)}
        >
          {isCustom && !showOther ? `${value}` : 'Other'}
        </button>
      </div>
      {showOther && (
        <form
          className="input-row other-minutes"
          onSubmit={(e) => {
            e.preventDefault();
            saveOther();
          }}
        >
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            placeholder="Minutes, e.g. 12"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
          <button type="submit" className="btn btn-green" disabled={!(Number(other) >= 1 && Number(other) <= 240)}>
            Set
          </button>
        </form>
      )}
      <div className="tiny muted" style={{ marginTop: 6 }}>
        {value} min per level
      </div>
    </>
  );
}
