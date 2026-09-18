import type { BlindLevel, ClockState } from '../types/app';

type Row = [sb: number, bb: number, ante: number];

function build(rows: Row[], minutes: number, breakEvery: number, breakMinutes: number): BlindLevel[] {
  const levels: BlindLevel[] = [];
  rows.forEach(([sb, bb, ante], index) => {
    levels.push({ sb, bb, ante, minutes, isBreak: false });
    const isLast = index === rows.length - 1;
    if (breakEvery > 0 && (index + 1) % breakEvery === 0 && !isLast) {
      levels.push({ sb: 0, bb: 0, ante: 0, minutes: breakMinutes, isBreak: true });
    }
  });
  return levels;
}

// House structure (big blinds): 200, 400, 800 — buy-ins close — then 1K, 2K, 4K, 8K, 10K, 20K, ...
// Small blind is always half the big blind.
const HOUSE_BIG_BLINDS = [200, 400, 800, 1000, 2000, 4000, 8000, 10000, 20000, 40000, 80000, 100000, 200000];
const HOME_GAME_ROWS: Row[] = HOUSE_BIG_BLINDS.map((bb) => [bb / 2, bb, 0]);

/** House blinds with every level set to `minutes`. */
export function houseLevels(minutes: number): BlindLevel[] {
  return build(HOME_GAME_ROWS, minutes, 0, 0);
}

const MINUTES_KEY = 'poker.levelMinutes';

/** Level length the admin used last on this phone (15 the first time). */
export function preferredMinutes() {
  try {
    const saved = Number(localStorage.getItem(MINUTES_KEY));
    if (saved >= 1 && saved <= 240) return saved;
  } catch {
    // Storage blocked.
  }
  return 15;
}

export function rememberMinutes(minutes: number) {
  try {
    localStorage.setItem(MINUTES_KEY, String(minutes));
  } catch {
    // Storage blocked.
  }
}

export const DEFAULT_LEVELS = houseLevels(15);

/** Next big blind in the 1-2-4-8-10 pattern (800 → 1000, 8000 → 10000, otherwise double). */
export function nextBigBlind(bb: number) {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, bb)));
  return bb / magnitude === 8 ? magnitude * 10 : bb * 2;
}

/** Level 3 = 400/800: buy-ins close when it ends. */
export const DEFAULT_LATE_REG_LEVEL = 3;

/** Index in `levels` of the n-th playing level (breaks not counted), or -1. */
export function levelIndexForNumber(levels: BlindLevel[], levelNumber: number) {
  let count = 0;
  for (let i = 0; i < levels.length; i += 1) {
    if (levels[i].isBreak) continue;
    count += 1;
    if (count === levelNumber) return i;
  }
  return -1;
}

export function initialClock(): ClockState {
  return { running: false, levelIndex: 0, levelElapsedMs: 0, startedAt: null };
}

/** Firebase drops empty arrays and can return sparse objects; normalise to a clean array. */
export function normalizeLevels(levels: unknown): BlindLevel[] {
  const list = Array.isArray(levels) ? levels : levels && typeof levels === 'object' ? Object.values(levels) : [];
  const clean = (list as Partial<BlindLevel>[])
    .filter(Boolean)
    .map((level) => ({
      sb: Number(level.sb) || 0,
      bb: Number(level.bb) || 0,
      ante: Number(level.ante) || 0,
      minutes: Math.max(1, Number(level.minutes) || 1),
      isBreak: !!level.isBreak,
    }));
  return clean.length > 0 ? clean : DEFAULT_LEVELS;
}

export type ClockView = {
  levelIndex: number;
  elapsedMs: number;
  remainingMs: number;
  durationMs: number;
  progress: number;
  running: boolean;
  finished: boolean;
  level: BlindLevel;
  nextLevel: BlindLevel | null;
  /** Number of the playing level, ignoring breaks (Level 1, Level 2, ...). */
  levelNumber: number;
};

/**
 * Walk forward from the stored anchor so every device agrees on the current level
 * without anyone having to write "level up" to the database.
 */
export function computeClock(clock: ClockState | undefined, levels: BlindLevel[], serverNow: number): ClockView {
  const state = clock ?? initialClock();
  const lastIndex = levels.length - 1;
  let index = Math.min(Math.max(0, state.levelIndex || 0), lastIndex);
  let elapsed = (state.levelElapsedMs || 0) + (state.running && state.startedAt ? Math.max(0, serverNow - state.startedAt) : 0);

  while (index < lastIndex && elapsed >= levels[index].minutes * 60_000) {
    elapsed -= levels[index].minutes * 60_000;
    index += 1;
  }

  const durationMs = levels[index].minutes * 60_000;
  const remainingMs = Math.max(0, durationMs - elapsed);
  const finished = index === lastIndex && remainingMs === 0;

  return {
    levelIndex: index,
    elapsedMs: Math.min(elapsed, durationMs),
    remainingMs,
    durationMs,
    progress: durationMs > 0 ? Math.min(1, Math.max(0, elapsed / durationMs)) : 0,
    running: state.running && !finished,
    finished,
    level: levels[index],
    nextLevel: levels[index + 1] ?? null,
    levelNumber: levels.slice(0, index + 1).filter((level) => !level.isBreak).length,
  };
}

export function formatClock(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  return `${hours > 0 ? `${hours}:` : ''}${mm}:${String(seconds).padStart(2, '0')}`;
}

export function chips(n: number) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000 && n % 100 === 0) return `${n / 1000}K`;
  return n.toLocaleString();
}

export function blindsLabel(level: BlindLevel) {
  if (level.isBreak) return 'Break';
  return `${chips(level.sb)} / ${chips(level.bb)}${level.ante > 0 ? ` · ante ${chips(level.ante)}` : ''}`;
}
