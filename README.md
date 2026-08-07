# Hotdog Party

A static game site with an interactive 3D hotdog. No build step to run it, no
frameworks, no CDN — the hotdog is generated in code.

## Dropping this into your existing repo

Copy the contents of this folder into your repo root. It **overwrites** four
files:

```
index.html      games.html      game.html      contact.html
```

and adds `assets/`, `tools/`, `.github/workflows/`, `games.sample.json`,
`src/`, `package.json`, `README.md`.

It **will rewrite `games.json`** the first time the Action runs — but only to
add folders that aren't listed yet and drop ones whose files are gone. Your
names, tags, and ordering are preserved. See below.

It does **not** touch `games/`, `admin.html`, `notifications.js`,
`favicon.png`, `CNAME`, or `LICENSE`. All your game folders are left exactly
as they are. Worth committing on a branch first so you can compare before
merging.

Once your own `games.json` is being used you can delete `games.sample.json`
and `assets/sample-icons/` — they're only there so the site has something to
show before it finds your list.

## The game list

The site reads **`games.json`** from the site root — and that file builds
itself from your `games/` folder, so you don't have to write it by hand.

### Adding a game

Drop the folder into `games/` and push. That's the whole job.

A GitHub Action (`.github/workflows/update-games.yml`) notices the change,
scans the folder, and commits an updated `games.json`. The new game appears on
the site a minute later. You can also run it yourself any time:

```bash
npm run scan
```

### How the scanner picks things

A folder counts as a game if it directly contains an `.html` file. If it
doesn't, the scanner looks inside its subfolders instead — so
`games/ragdoll/archers/` works.

For the game file it prefers, in order: `index.html`, then one named after the
folder (`archery/archery.html`), then the only `.html` there, then the
shortest name. Files like `credits.html` and `privacy.html` are ignored.

For the icon: `icon.*` / `logo.* `/ `thumb.*` / `cover.*` first, then one named
after the folder, then the largest image in the folder. Your
`games/archery/icon.png` gets picked up automatically.

The name comes from the folder — `snow_rider` becomes "Snow Rider", and a
nested `ragdoll/archers` becomes "Ragdoll Archers".

### Your edits are kept

The scanner never overwrites your work. Rename a game to `"1v1.lol"`, add
`"tags": ["multiplayer"]`, reorder the list — all of that survives every
re-scan. The scanner only:

- adds games it hasn't seen before (to the end of the list)
- removes entries whose files are gone
- repairs a `path` when you rename a game's HTML file

So the workflow is: push the folder, let it generate the entry, then tweak the
name in `games.json` once if the auto-generated one isn't quite right.

### The format

```json
{
  "name": "Snow Rider",
  "path": "games/snow_rider/snow_rider.html",
  "icon": "games/snow_rider/snow-rider-3d.png",
  "tags": ["multiplayer"]
}
```

`tags` is optional — a `"multiplayer"` tag puts a **2P** badge on the tile and
shows 2 players on the game page. Two more optional fields:

- `"accent": "#00bcd4"` — re-themes that game's page in that colour
- `"tag": "Three laps, one slippery track"` — a one-line description

If a game has no icon, its tile shows the game's initials instead, so a missing
image never leaves a blank square.

## How the pages work

**games.html** — every game as a square logo tile, six across. The name is
hidden until you hover (always visible on touch screens, which can't hover).
There's a search box, and a Most Played top 10 down the right side.

**contact.html** — two cards, both linking straight to your Google Forms: the
bug report form and the game submission form. Both open in a new tab. To
change them, edit the `href` on the two `a.info` cards (and the
`btn-report` handler in `game.html`, which opens the bug form too).

**game.html** — the player. `game.html?g=snow-rider` — the slug comes from the
game's name automatically. Toolbar has Back, the game's logo and name, the
play timer, restart, report, and fullscreen. Quick Play sits alongside,
ordered by play count.

## Play counts (Firebase)

A play is counted once someone has had a game page open for **10 seconds**.
The toolbar pill counts down and turns green when it lands.

**Setup:** in the Firebase console create a **Firestore** database, then
Project settings → Your apps → Web app → Config, and paste that object into
`assets/firebase-config.js`.

Until you do, counts save to each visitor's own browser, so nothing breaks —
the numbers just aren't shared. The games page says "Counting locally" when
that's happening and "Live from Firebase" once it's connected.

**Firestore rules.** The site writes one document per game into a `plays`
collection. These let anyone read the leaderboard and bump a counter, but not
delete one:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plays/{slug} {
      allow read: if true;
      allow create, update: if
        request.resource.data.count is int &&
        request.resource.data.count >= 0;
      allow delete: if false;
    }
  }
}
```

Those API keys are meant to be public — Firebase security comes from these
rules, not from hiding the config.

Anyone determined could still inflate a count, since the write happens in the
browser. Normal for a client-side leaderboard and fine for a school site. If
it ever matters, the fix is a Cloud Function that owns the writes.

All the database code is in `src/plays.js` alone, so switching to Realtime
Database later means changing one file.

## Files

```
index.html                Home — wordmark over the 3D hotdog
games.html                Logo grid + Most Played
game.html                 The player
contact.html              Contact info

games.json                Your game list — generated from games/
games.sample.json         Demo list, used only if games.json is missing

tools/scan-games.mjs      Builds games.json from the games/ folder
.github/workflows/        Runs the scanner automatically on push

assets/firebase-config.js ← PASTE YOUR FIREBASE KEYS HERE
assets/gamedata.js        Reads and normalises games.json
assets/site.css           All shared styling
assets/hotdog.bundle.js   3D hotdog + Three.js, prebuilt
assets/plays.bundle.js    Play tracking + Firebase, prebuilt
assets/sample-icons/      Placeholder logos for the demo list

src/                      Readable source for the two bundles
```

## Local preview

`games.json` is loaded with `fetch`, which browsers block on `file://`. So for
local previewing, run a server:

```bash
python3 -m http.server 8000
```

then open <http://localhost:8000>. On GitHub Pages it just works.

## Commands

```bash
npm run scan     # rebuild games.json from the games/ folder
npm run build    # rebuild the JS bundles (only if you edit src/)
```

`npm run scan` needs nothing installed beyond Node itself. `npm run build`
needs `npm install` first.

## Notes

- The hotdog responds to drag (spin) and scroll (zoom) on the home page, and
  spins in the background on the games, game, and contact pages.
- The browser-tab icon comes from `favicon.png` in the site root. Every page
  links to it; swap that file to change the icon everywhere.
- Every page is responsive: the grid steps 6 → 5 → 4 → 3 → 2 across as the
  screen narrows.
- Some sites block being embedded in a frame. If a game works in its own tab
  but stays blank in the player, that site doesn't allow embedding — host the
  game yourself instead.
