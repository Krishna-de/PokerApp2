import { get, ref, update } from 'firebase/database';
import { db } from '../firebase';
import type { LevelSound, UserIdentity } from '../types/app';

/** Public list entry for a player's uploaded blinds-up tone (the audio itself lives in tones/{uid}). */
export type ToneInfo = {
  uid: string;
  name: string;
  ownerName: string;
  durationSec: number;
  sizeKb: number;
  createdAt: number;
};

export const MAX_TONE_BYTES = 600 * 1024;
export const MAX_TONE_SECONDS = 30;

/** Room setting value for a player's tone. */
export const toneSound = (uid: string) => `tone:${uid}` as LevelSound;
export const toneUidOf = (sound: LevelSound) => (sound.startsWith('tone:') ? sound.slice(5) : null);
/** Song and uploaded tones are music: no countdown and no blind amounts before them. */
export const isMusicSound = (sound: LevelSound) => sound === 'song' || sound.startsWith('tone:');

const dataCache = new Map<string, Promise<string | null>>();

/** The tone's audio as a data: URL (downloaded once per phone). */
export function toneDataUrl(uid: string) {
  let loading = dataCache.get(uid);
  if (!loading) {
    loading = get(ref(db, `tones/${uid}/data`))
      .then((snap) => (snap.val() as string | null) ?? null)
      .catch((error) => {
        console.warn('Tone failed to load', error);
        dataCache.delete(uid);
        return null;
      });
    dataCache.set(uid, loading);
  }
  return loading;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Upload the user's single tone. The database rules refuse it if they already have one. */
export async function uploadTone(user: UserIdentity, file: File, durationSec: number) {
  const raw = await readAsDataUrl(file);
  // Normalise the MIME type so every browser treats it as MP3.
  const data = raw.replace(/^data:[^;]*;/, 'data:audio/mpeg;');
  const info: Omit<ToneInfo, 'uid'> = {
    name: file.name.replace(/\.mp3$/i, '').slice(0, 40) || 'My tone',
    ownerName: user.displayName,
    durationSec: Math.round(durationSec * 10) / 10,
    sizeKb: Math.round(file.size / 1024),
    createdAt: Date.now(),
  };
  await update(ref(db), { [`toneIndex/${user.uid}`]: info, [`tones/${user.uid}`]: { data } });
  dataCache.delete(user.uid);
}

export async function deleteTone(uid: string) {
  await update(ref(db), { [`toneIndex/${uid}`]: null, [`tones/${uid}`]: null });
  dataCache.delete(uid);
}
