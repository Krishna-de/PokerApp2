export const THEMES = [
  { id: 'graphite', label: 'Graphite', bg: '#121417', accent: '#38bdf8' },
  { id: 'midnight', label: 'Midnight', bg: '#0c1426', accent: '#6ea8ff' },
  { id: 'casino', label: 'Casino', bg: '#140c0d', accent: '#e5484d' },
  { id: 'violet', label: 'Violet', bg: '#140d20', accent: '#a78bfa' },
  { id: 'felt', label: 'Felt', bg: '#0a1a10', accent: '#5ad17a' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const KEY = 'poker.theme';

export function getTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(KEY);
    if (THEMES.some((t) => t.id === saved)) return saved as ThemeId;
  } catch {
    // Storage blocked — fall back to default.
  }
  return 'graphite';
}

export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  if (id === 'graphite') delete root.dataset.theme;
  else root.dataset.theme = id;
  const theme = THEMES.find((t) => t.id === id);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme?.bg ?? '#0b0c0e');
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // Preference lasts for this session only.
  }
}
