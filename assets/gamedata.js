/* ============================================================
   Hotdog Party — game list loader
   ------------------------------------------------------------
   Reads games.json from the site root. That file is the single
   source of truth for the whole site — the same format you're
   already using:

     [
       {
         "name": "Snow Rider",
         "path": "games/snow_rider/snow_rider.html",
         "icon": "games/snow_rider/snow-rider-3d.png",
         "tags": ["multiplayer"]        // optional
       },
       ...
     ]

   Optional extras this site understands, if you ever want them:
     "accent": "#ff8c00"   re-themes that game's page
     "tag":    "short line shown on the game page"

   Nothing else needs editing. Add a game to games.json and it
   appears in the grid, the player, and the leaderboard.
   ============================================================ */

(function () {
  var cache = null;

  // "Snow Rider" -> "snow-rider" (used in URLs and as the Firebase doc id)
  function slugify(s) {
    return String(s).toLowerCase()
      .replace(/['’.]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'game';
  }

  function normalise(list) {
    var seen = {};
    return (list || []).filter(function (g) { return g && (g.name || g.title); }).map(function (g) {
      var title = g.name || g.title;
      var slug  = g.slug || slugify(title);
      if (seen[slug]) { seen[slug]++; slug = slug + '-' + seen[slug]; } else { seen[slug] = 1; }
      return {
        slug:   slug,
        title:  title,
        url:    g.path || g.url || '',
        icon:   g.icon || '',
        tags:   g.tags || [],
        accent: g.accent || '',
        tag:    g.tag || '',
      };
    });
  }

  /** Resolves to the normalised game list. Cached after the first call. */
  function load() {
    if (cache) return Promise.resolve(cache);

    return fetch('games.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('games.json ' + r.status); return r.json(); })
      .catch(function () {
        // Not there yet (or opened straight off the filesystem) — try the demo list
        return fetch('games.sample.json', { cache: 'no-cache' })
          .then(function (r) { if (!r.ok) throw new Error('no sample'); return r.json(); })
          .then(function (list) {
            console.info('[games] Using games.sample.json — add a games.json to the site root to use your own list.');
            return list;
          });
      })
      .then(function (list) { cache = normalise(list); return cache; })
      .catch(function (err) {
        console.error('[games] Could not load a game list:', err.message);
        cache = [];
        return cache;
      });
  }

  function find(list, slug) {
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
    return null;
  }

  /** Tile/thumbnail markup: the logo if there is one, initials if not. */
  function thumb(game, cls) {
    var initials = game.title.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/)
      .slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() || '?';
    var safe = String(game.title).replace(/"/g, '&quot;');
    return '<span class="' + (cls || 'thumb') + '">' +
             '<span class="thumb-fallback">' + initials + '</span>' +
             (game.icon
               ? '<img src="' + game.icon + '" alt="" loading="lazy" decoding="async" ' +
                 'onerror="this.remove()" title="' + safe + '">'
               : '') +
           '</span>';
  }

  window.GameData = { load: load, find: find, thumb: thumb, slugify: slugify };
})();
