import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../firebase';
import type { BlindLevel, ClockState } from '../types/app';
import { blindsLabel, computeClock, type ClockView } from '../utils/blinds';
import { keepScreenAwake, playSound, showSystemNotification, speak, vibrate } from '../utils/alerts';

const ALERTS_KEY = 'poker.alertsEnabled';

export function useAlertsPreference() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(ALERTS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const update = useCallback((next: boolean) => {
    setEnabled(next);
    try {
      localStorage.setItem(ALERTS_KEY, next ? '1' : '0');
    } catch {
      // Private mode — preference lasts for this session only.
    }
  }, []);

  return [enabled, update] as const;
}

/** Clock offset between this device and the Firebase server, so every phone shows the same time. */
export function useServerOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    return onValue(ref(db, '.info/serverTimeOffset'), (snap) => setOffset(Number(snap.val()) || 0));
  }, []);
  return offset;
}

/** What gets announced after "Time is up!", e.g. "Blinds are now 500, 1000." */
function newLevelPhrase(level: BlindLevel) {
  if (level.isBreak) return 'Break time.';
  const ante = level.ante > 0 ? `, ante ${level.ante}` : '';
  return `Blinds are now ${level.sb}, ${level.bb}${ante}.`;
}

/** "Time is up! Time is up!", fanfare, then the new blinds. */
function announceLevel(level: BlindLevel) {
  speak('Time is up! Time is up!');
  window.setTimeout(() => {
    playSound(level.isBreak ? 'break' : 'level');
    vibrate([400, 150, 400, 150, 800]);
  }, 1700);
  window.setTimeout(() => speak(newLevelPhrase(level)), level.isBreak ? 3000 : 3900);
}

type Options = {
  clock: ClockState | undefined;
  levels: BlindLevel[];
  active: boolean;
  alertsEnabled: boolean;
  roomTitle: string;
};

export function useTournamentClock({ clock, levels, active, alertsEnabled, roomTitle }: Options) {
  const offset = useServerOffset();
  const serverNow = useCallback(() => Date.now() + offset, [offset]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [active]);

  const view: ClockView = useMemo(() => computeClock(clock, levels, now + offset), [clock, levels, now, offset]);

  // --- Alerts on level change and one minute before the level ends ---
  const lastLevelRef = useRef<number | null>(null);
  const lastRemainingRef = useRef<number | null>(null);
  const lastCountdownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active) {
      lastLevelRef.current = null;
      lastRemainingRef.current = null;
      return;
    }

    const prevLevel = lastLevelRef.current;
    const prevRemaining = lastRemainingRef.current;
    lastLevelRef.current = view.levelIndex;
    lastRemainingRef.current = view.remainingMs;

    if (!alertsEnabled || prevLevel === null) return;

    if (prevLevel !== view.levelIndex) {
      const { level, nextLevel } = view;
      const title = level.isBreak ? '☕ Break time' : `⬆️ Blinds up — Level ${view.levelNumber}`;
      const body = level.isBreak
        ? `${level.minutes} min break${nextLevel ? ` · next ${blindsLabel(nextLevel)}` : ''}`
        : `${blindsLabel(level)} · ${level.minutes} min`;
      if (view.levelIndex > prevLevel) {
        announceLevel(level);
      } else {
        // Admin stepped back a level: just a short cue.
        playSound('warning');
      }
      if (document.visibilityState === 'hidden') {
        void showSystemNotification(title, `${roomTitle} · ${body}`);
      }
      return;
    }

    // Spoken countdown over the last five seconds: "5, 4, 3, 2, 1".
    const secondsLeft = Math.ceil(view.remainingMs / 1000);
    const countdownKey = `${view.levelIndex}:${secondsLeft}`;
    if (view.running && view.nextLevel && secondsLeft >= 1 && secondsLeft <= 5 && lastCountdownRef.current !== countdownKey) {
      lastCountdownRef.current = countdownKey;
      playSound('tick');
      speak(String(secondsLeft));
    }

    const crossedOneMinute =
      view.running && prevRemaining !== null && prevRemaining > 60_000 && view.remainingMs <= 60_000 && view.durationMs > 120_000;
    if (crossedOneMinute) {
      playSound('warning');
      vibrate([200, 100, 200]);
      if (document.visibilityState === 'hidden' && view.nextLevel) {
        void showSystemNotification('⏱ 1 minute left', `Next: ${blindsLabel(view.nextLevel)}`);
      }
    }
  }, [active, alertsEnabled, view, roomTitle]);

  // Keep the phone screen on while the clock runs, so timers and sounds are not suspended.
  useEffect(() => {
    const want = active && alertsEnabled && view.running;
    void keepScreenAwake(want);
    if (!want) return;
    const reacquire = () => {
      if (document.visibilityState === 'visible') void keepScreenAwake(true);
    };
    document.addEventListener('visibilitychange', reacquire);
    return () => document.removeEventListener('visibilitychange', reacquire);
  }, [active, alertsEnabled, view.running]);

  useEffect(() => () => void keepScreenAwake(false), []);

  /** Play exactly what the table will hear at the end of a level: countdown, then the announcement. */
  const previewAlert = useCallback(() => {
    const next = view.nextLevel && !view.nextLevel.isBreak ? view.nextLevel : view.level;
    [5, 4, 3, 2, 1].forEach((n, i) =>
      window.setTimeout(() => {
        playSound('tick');
        speak(String(n));
      }, i * 1000)
    );
    window.setTimeout(() => announceLevel(next), 5000);
  }, [view.level, view.nextLevel]);

  return { view, serverNow, previewAlert };
}
