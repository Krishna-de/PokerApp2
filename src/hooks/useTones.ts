import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../firebase';
import type { ToneInfo } from '../utils/tones';

/** All uploaded tones (names only, not the audio), newest first. */
export function useToneIndex() {
  const [tones, setTones] = useState<ToneInfo[]>([]);
  useEffect(
    () =>
      onValue(
        ref(db, 'toneIndex'),
        (snap) => {
          const value = (snap.val() ?? {}) as Record<string, Omit<ToneInfo, 'uid'>>;
          setTones(
            Object.entries(value)
              .map(([uid, info]) => ({ uid, ...info }))
              .sort((a, b) => b.createdAt - a.createdAt)
          );
        },
        (error) => console.warn('Tone list unavailable', error)
      ),
    []
  );
  return tones;
}
