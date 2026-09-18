# CLAUDE.md — PokerApp2 (Home Poker Tracker)

Handoff notes for continuing work on this app. Read this before changing anything.

## What it is

Mobile-first React + Vite + TypeScript app for running home poker tournaments, backed by Firebase
(Realtime Database + Auth + Hosting). Used mainly on phones at the table, often with up to 12 players.

- Live site: https://poker-tracker-2ab9c.web.app
- Firebase project: `poker-tracker-2ab9c` (owner: Krishna; collaborators have Editor)
- Database URL (europe-west1): `https://poker-tracker-2ab9c-default-rtdb.europe-west1.firebasedatabase.app`
- Repo: https://github.com/Krishna-de/PokerApp2 (branch `main`)
- Originally generated with bolt / Firebase Studio. Plain CSS in `src/index.css` (Tailwind is configured but not used).

## Commands

```bash
npm install
npm run dev                       # add --host to test on a phone over Wi-Fi
npx tsc -p tsconfig.app.json --noEmit
npm run build
firebase deploy --only hosting    # website
firebase deploy --only database   # database.rules.json
```

`.env` (not committed) holds the `VITE_FIREBASE_*` web config — see `.env.example`.
Existing lint errors (`any` in auth handlers) predate this work.

## Code map

- `src/App.tsx` — almost everything: auth, room join/create, all tournament actions, and all page UI
  (setup / live / results / log / history / room tabs, knockout wizard, payout modal).
- `src/components/TournamentClock.tsx` — clock card + full-screen table view; admin controls.
- `src/components/BlindStructureEditor.tsx` — level list / editor ("Reset to house blinds").
- `src/components/NumberField.tsx` — number input that commits on blur (lets users clear the field).
- `src/components/ThemePicker.tsx`, `src/utils/theme.ts` — 5 dark themes, per-device (localStorage).
- `src/hooks/useTournamentClock.ts` — ticking clock, server-time offset, alerts (countdown voice, fanfare,
  1-minute warning, notifications, wake lock), `previewAlert` for the "Test" button.
- `src/hooks/useLiveRooms.ts` — public "Live now" list: `rooms` query `phase == 'game'`, active in last 12 h.
- `src/utils/blinds.ts` — house structure, `computeClock`, level helpers, remembered level minutes.
- `src/utils/alerts.ts` — Web Audio sounds (fanfare, pops, ticks), `speak()` via speechSynthesis, vibration,
  service-worker notifications, wake lock.
- `src/utils/room.ts` — room defaults, event creation + event text. `src/utils/names.ts` — funny room names.
- `public/sw.js` + `manifest.webmanifest` — minimal SW (notifications, installable PWA). No caching.

## Key design decisions (keep these)

- **Clock sync**: `rooms/{id}/clock = { running, levelIndex, levelElapsedMs, startedAt }` in *server time*.
  Every device derives the current level with `computeClock` — nobody writes "level up".
  Whenever levels change mid-game, **re-anchor the clock** to the current level (`saveLevels` does this);
  otherwise changing earlier levels' minutes makes the clock jump levels.
- **Timer**: admin sets minutes per level (buttons 10/15/20/30 + "Other"). Mid-game changes apply to the
  current + later levels; if the current level already ran past the new length, it starts next level.
  New rooms use the admin's last-used minutes (localStorage `poker.levelMinutes`, default 15).
- **House blinds** (big blind): 200, 400, 800 → admin reminded to close buy-ins after the 800 level (`lateRegLevel = 3`) →
  1K, 2K, 4K, 8K, 10K, 20K, 40K, 80K, 100K, 200K. SB = BB/2. No scheduled breaks — admin pauses for breaks.
- **Buy-ins close only when the admin taps Close** (`settings.buyinsClosed`). Never auto-close.
  `lateRegLevel` is just a reminder: after that level the status line turns gold for the admin.
  Rebuys only while open (checkbox per busted player in the knockout wizard).
- **Knockouts**: wizard — who is out → one screen per busted player "who took this bounty" (multi-select =
  split that bounty) → winning hand + rebuys + summary. `bustedBy: Record<bustedId, winnerIds[]>`.
- **Standings (live)**: Buy-in (paid, ×N rebuys) · Bounty net (won − lost). Admin taps an active row to open
  the knockout wizard for that player.
- **Results**: pot net (prize − buy-ins) and bounty net shown **separately**, plus total. Never merge them.
- **Admin**: PIN per room in `roomPins/{id}` (NOT in the public room). Admin stays unlocked across refresh
  when `room.currentAdmin.uid === me`; locks if someone else takes admin.
- **Spectators**: `rooms` is publicly readable; guests watch read-only without an account.
- Up to **12 players** (`MAX_PLAYERS`). Finish allowed at ≤ 5 players left.

## Database rules (`database.rules.json`, published)

`rooms` read: everyone; write: non-anonymous auth; `.indexOn: phase`. `roomPins/$id` read/write:
non-anonymous auth. `users` read auth, write own uid. `history` read/write auth.
Anonymous sign-in is **not** enabled in the project (the app tolerates this).

## User preferences (from the owner)

- Phone-first: minimise scrolling and width; big tap targets; everything must fit 360px wide.
- Dark themes only; monospace font (JetBrains Mono). Disliked: green theme, violet theme. Default is Graphite.
- No animations/fireworks — sound + voice only for level changes.
- Setup page order: tournament name → buy-in & bounty → blind timer (levels list collapsed) → players →
  invite players at the bottom. Timer settings always visible.
- Ask before deploying; deploys replace the live site used by the group.

## Known gaps / ideas

- True lock-screen push needs FCM + Cloud Functions (Blaze plan) — not implemented.
- Old unfinished games stay `phase: 'game'` in the DB; the live list hides anything idle > 12 h.
- `App.tsx` is large; splitting into page components would help.
- Possible next: sort standings by Net; show game name on spectator home cards (already shown).
