# Hotdog Party

A static game site with an interactive 3D hotdog. No build step to run it, no
frameworks, no CDN — the hotdog is generated in code.

## Dropping this into your existing repo

Copy the contents of this folder into your repo root. It **overwrites** four
files:

```
index.html      games.html      game.html      contact.html
```

and adds `assets/`, `games.sample.json`, `src/`, `package.json`, `README.md`.

It does **not** touch `games.json`, `games/`, `admin.html`, `notifications.js`,
`favicon.png`, `CNAME`, or `LICENSE`. Your game list and all your game folders
are left exactly as they are. Worth committing on a branch first so you can
compare before merging.

Once your own `games.json` is being used you can delete `games.sample.json`
and `assets/sample-icons/` — they're only there so the site has something to
show before it finds your list.

## The game list

The site reads **`games.json`** from the site root — the same format you're
already using:

```json
{
  "name": "Snow Rider",
  "path": "games/snow_rider/snow_rider.html",
  "icon": "games/snow_rider/snow-rider-3d.png",
  "tags": ["multiplayer"]
}
```

`name`, `path`, and `icon` are all it needs. `tags` is optional — a
`"multiplayer"` tag puts a **2P** badge on the tile and shows 2 players on the
game page.

Two optional extras this site understands, if you ever want them:

- `"accent": "#00bcd4"` — re-themes that game's page in that colour
- `"tag": "Three laps, one slippery track"` — a one-line description under the
  player

Add a game to `games.json` and it shows up everywhere: the grid, the player,
Quick Play, and the leaderboard. Nothing else to edit.

If a game has no `icon`, its tile falls back to the game's initials, so a
missing or broken image never leaves a blank square.

## How the pages work

**games.html** — every game as a square logo tile, six across. The name is
hidden until you hover (always visible on touch screens, which can't hover).
There's a search box, and a Most Played top 10 down the right side.

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

games.json                ← YOUR GAME LIST (yours, untouched)
games.sample.json         Demo list, used only if games.json is missing

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

## Rebuilding the bundles

Only needed if you edit something in `src/`:

```bash
npm install
npm run build
```

## Notes

- The hotdog responds to drag (spin) and scroll (zoom) on the home page.
- Every page is responsive: the grid steps 6 → 5 → 4 → 3 → 2 across as the
  screen narrows.
- Some sites block being embedded in a frame. If a game works in its own tab
  but stays blank in the player, that site doesn't allow embedding — host the
  game yourself instead.
