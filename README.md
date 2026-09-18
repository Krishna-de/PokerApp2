# PokerApp2 — Home Poker Tracker

Mobile-first tracker for home poker tournaments, shared live on every phone through Firebase.

Live site: https://poker-tracker-2ab9c.web.app

## Features

- **Blinds clock** synced across all phones (server time), with pause/resume, skip, +1 min and a full-screen table view.
- **Level timer** set by the admin per tournament (any minutes), changeable mid-game for the current and upcoming levels.
- **House blind structure**: 100/200, 200/400, 400/800 (buy-ins close after this level), then 1K, 2K, 4K, 8K, 10K, 20K, …
- **Alerts**: spoken 5-4-3-2-1 countdown, "Time is up!", fanfare and the new blinds; 1-minute warning; vibration; background notifications; screen kept awake.
- **Knockouts** in steps: several players can bust in one hand, each bounty goes to whoever won it (split pots supported), rebuy checkbox while buy-ins are open.
- **Standings** with buy-in, bounty and net per player; payouts and final results.
- **Watch without login**: the home page lists games in progress; anyone can open one read-only.
- Admin PIN per room, event log, history, rematch, funny tournament names, 5 dark themes.

## Development

```bash
npm install
cp .env.example .env   # fill in the Firebase web config
npm run dev
```

## Deploy

```bash
npm run build
firebase deploy --only hosting     # website
firebase deploy --only database    # database.rules.json
```

## Database layout

| Path | Who can read | Notes |
|---|---|---|
| `rooms/{id}` | everyone | tournament state (players, clock, levels, events) |
| `roomPins/{id}` | logged-in users | admin PIN, kept out of the public room data |
| `users/{uid}` | logged-in users | profiles; each user writes only their own |
| `history/{id}` | logged-in users | finished tournaments |

Writes need a real (non-anonymous) login. Rules live in `database.rules.json`.
