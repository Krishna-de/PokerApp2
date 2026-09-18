import { useEffect, useState } from 'react';

type Props = {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  step?: number;
  prefix?: string;
  disabled?: boolean;
};

/** Number input that keeps a local draft and saves on blur/Enter, so the field can be cleared while typing. */
export default function NumberField({ label, value, onCommit, min = 0, step = 1, prefix, disabled }: Props) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function commit() {
    setFocused(false);
    const n = Number(draft);
    if (draft.trim() === '' || Number.isNaN(n) || n < min) {
      setDraft(String(value));
      return;
    }
    if (n !== value) onCommit(n);
  }

  return (
    <label className="field">
      <span>{label}</span>
      <div className="money-input">
        {prefix && <span>{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={draft}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </div>
    </label>
  );
}
