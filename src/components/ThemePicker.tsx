import { useState } from 'react';
import { THEMES, applyTheme, getTheme, type ThemeId } from '../utils/theme';

export default function ThemePicker() {
  const [current, setCurrent] = useState<ThemeId>(getTheme);

  return (
    <div className="theme-grid">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          className={`theme-swatch ${current === theme.id ? 'active' : ''}`}
          onClick={() => {
            applyTheme(theme.id);
            setCurrent(theme.id);
          }}
          aria-pressed={current === theme.id}
        >
          <span className="theme-dot" style={{ background: `linear-gradient(135deg, ${theme.bg} 50%, ${theme.accent} 50%)` }} />
          {theme.label}
        </button>
      ))}
    </div>
  );
}
