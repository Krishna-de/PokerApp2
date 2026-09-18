import { useEffect, useState } from 'react';
import { Coffee, Plus, Trash2 } from 'lucide-react';
import type { BlindLevel } from '../types/app';
import { blindsLabel, houseLevels, nextBigBlind, preferredMinutes } from '../utils/blinds';

type Props = {
  levels: BlindLevel[];
  isAdmin: boolean;
  currentIndex?: number;
  onSave: (levels: BlindLevel[]) => Promise<void> | void;
};

function sameLevels(a: BlindLevel[], b: BlindLevel[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function BlindStructureEditor({ levels, isAdmin, currentIndex, onSave }: Props) {
  const [draft, setDraft] = useState<BlindLevel[]>(levels);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = !sameLevels(draft, levels);

  useEffect(() => {
    if (!editing) setDraft(levels);
  }, [levels, editing]);

  function patch(index: number, key: keyof BlindLevel, value: string) {
    const n = Math.max(0, Number(value) || 0);
    setDraft((prev) => prev.map((level, i) => (i === index ? { ...level, [key]: n } : level)));
  }

  function addLevel() {
    setDraft((prev) => {
      const last = [...prev].reverse().find((level) => !level.isBreak);
      const bb = last ? nextBigBlind(last.bb) : 200;
      const sb = bb / 2;
      const minutes = last?.minutes ?? 15;
      return [...prev, { sb, bb, ante: last?.ante ? bb : 0, minutes, isBreak: false }];
    });
  }

  function addBreak() {
    setDraft((prev) => [...prev, { sb: 0, bb: 0, ante: 0, minutes: 10, isBreak: true }]);
  }

  function remove(index: number) {
    setDraft((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function save() {
    const cleaned = draft.map((level) => ({ ...level, minutes: Math.max(1, level.minutes) }));
    setSaving(true);
    try {
      await onSave(cleaned);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  let levelNo = 0;

  if (!editing) {
    return (
      <>
        <div className="level-list">
          {levels.map((level, index) => {
            if (!level.isBreak) levelNo += 1;
            return (
              <div
                key={index}
                className={`level-row ${level.isBreak ? 'is-break' : ''} ${index === currentIndex ? 'current' : ''} ${
                  currentIndex !== undefined && index < currentIndex ? 'done' : ''
                }`}
              >
                <span className="level-no">{level.isBreak ? <Coffee size={14} /> : levelNo}</span>
                <span className="level-blinds">{blindsLabel(level)}</span>
                <span className="level-min">{level.minutes}m</span>
              </div>
            );
          })}
        </div>
        {isAdmin && (
          <button className="btn btn-dark btn-block" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>
            Edit blind structure
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <button
        className="btn btn-dark btn-block"
        style={{ marginBottom: 12 }}
        onClick={() => setDraft(houseLevels(draft.find((l) => !l.isBreak)?.minutes ?? preferredMinutes()))}
      >
        Reset to house blinds (100/200 → …)
      </button>

      <div className="level-edit-head">
        <span>#</span>
        <span>SB</span>
        <span>BB</span>
        <span>Ante</span>
        <span>Min</span>
        <span />
      </div>
      <div className="level-list">
        {draft.map((level, index) => {
          if (!level.isBreak) levelNo += 1;
          return (
            <div key={index} className={`level-edit-row ${level.isBreak ? 'is-break' : ''}`}>
              <span className="level-no">{level.isBreak ? <Coffee size={14} /> : levelNo}</span>
              {level.isBreak ? (
                <span className="level-break-label">Break</span>
              ) : (
                <>
                  <input inputMode="numeric" type="number" min="0" value={level.sb || ''} placeholder="0" onChange={(e) => patch(index, 'sb', e.target.value)} aria-label="Small blind" />
                  <input inputMode="numeric" type="number" min="0" value={level.bb || ''} placeholder="0" onChange={(e) => patch(index, 'bb', e.target.value)} aria-label="Big blind" />
                  <input inputMode="numeric" type="number" min="0" value={level.ante || ''} placeholder="0" onChange={(e) => patch(index, 'ante', e.target.value)} aria-label="Ante" />
                </>
              )}
              <input inputMode="numeric" type="number" min="1" value={level.minutes || ''} placeholder="15" onChange={(e) => patch(index, 'minutes', e.target.value)} aria-label="Minutes" />
              <button className="icon-btn" onClick={() => remove(index)} aria-label="Remove level">
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="btn-pair" style={{ marginTop: 10 }}>
        <button className="btn btn-dark" onClick={addLevel}>
          <Plus size={16} /> Level
        </button>
        <button className="btn btn-dark" onClick={addBreak}>
          <Coffee size={16} /> Break
        </button>
      </div>
      <div className="btn-pair" style={{ marginTop: 10 }}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setDraft(levels);
            setEditing(false);
          }}
          disabled={saving}
        >
          Cancel
        </button>
        <button className="btn btn-green" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save structure'}
        </button>
      </div>
    </>
  );
}
