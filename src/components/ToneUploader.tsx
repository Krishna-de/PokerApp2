import { useRef, useState } from 'react';
import { Pause, Play, Trash2, Upload } from 'lucide-react';
import type { UserIdentity } from '../types/app';
import { audioDuration, playClip, stopSong, unlockAudio } from '../utils/alerts';
import { deleteTone, MAX_TONE_BYTES, MAX_TONE_SECONDS, toneDataUrl, uploadTone, type ToneInfo } from '../utils/tones';

type Props = {
  user: UserIdentity;
  myTone: ToneInfo | undefined;
  onMessage: (message: string) => void;
};

/** Each registered player can keep one MP3 tone; to replace it they delete it first. */
export default function ToneUploader({ user, myTone, onMessage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!/\.mp3$/i.test(file.name) && file.type !== 'audio/mpeg') {
      onMessage('Please choose an MP3 file.');
      return;
    }
    if (file.size > MAX_TONE_BYTES) {
      onMessage(`That file is ${Math.round(file.size / 1024)} KB — the limit is ${MAX_TONE_BYTES / 1024} KB (about ${MAX_TONE_SECONDS} s).`);
      return;
    }
    setBusy(true);
    try {
      await unlockAudio();
      const seconds = await audioDuration(await file.arrayBuffer());
      if (seconds === null) {
        onMessage('This MP3 could not be played. Try exporting it again.');
        return;
      }
      if (seconds > MAX_TONE_SECONDS + 0.5) {
        onMessage(`That tone is ${Math.round(seconds)} s long — keep it to ${MAX_TONE_SECONDS} s or less.`);
        return;
      }
      await uploadTone(user, file, seconds);
      onMessage('Tone uploaded. The admin can now pick it for the room.');
    } catch (error) {
      console.error('Tone upload failed', error);
      onMessage('Upload failed — check your connection and try again.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function preview() {
    if (playing) {
      stopSong();
      setPlaying(false);
      return;
    }
    await unlockAudio();
    const data = await toneDataUrl(user.uid);
    setPlaying(true);
    await playClip(data);
    window.setTimeout(() => setPlaying(false), (myTone?.durationSec ?? 5) * 1000);
  }

  async function remove() {
    if (!window.confirm('Delete your tone? Rooms using it will fall back to the fanfare.')) return;
    setBusy(true);
    try {
      stopSong();
      await deleteTone(user.uid);
      onMessage('Tone deleted. You can upload a new one.');
    } catch (error) {
      console.error('Tone delete failed', error);
      onMessage('Could not delete the tone — try again.');
    } finally {
      setBusy(false);
    }
  }

  if (myTone) {
    return (
      <div className="tone-row">
        <div className="tone-main">
          <div className="player-name">🎧 {myTone.name}</div>
          <div className="tiny muted">
            {myTone.durationSec}s · {myTone.sizeKb} KB · delete it to upload a different one
          </div>
        </div>
        <button className="icon-chip" onClick={preview} aria-label={playing ? 'Stop preview' : 'Play preview'}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="icon-chip danger" onClick={remove} disabled={busy} aria-label="Delete my tone">
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input ref={fileRef} type="file" accept=".mp3,audio/mpeg" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <button className="btn btn-dark btn-block" onClick={() => fileRef.current?.click()} disabled={busy}>
        <Upload size={16} /> {busy ? 'Uploading…' : 'Upload my MP3 tone'}
      </button>
      <div className="tiny muted" style={{ marginTop: 6 }}>
        One tone per player · MP3 · up to {MAX_TONE_BYTES / 1024} KB and {MAX_TONE_SECONDS} s.
      </div>
    </>
  );
}
