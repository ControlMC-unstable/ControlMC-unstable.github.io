/* ============================================================
   Hotdog Party — play tracking
   ------------------------------------------------------------
   Counts a play once a game page has been open for 10 seconds,
   and reads back the most-played list.

   Everything database-specific lives in this one file. It uses
   Cloud Firestore. If you ever switch to Realtime Database,
   this is the only file that changes.

   Firestore layout — one document per game:
     plays/{slug}  →  { slug, title, count }

   If assets/firebase-config.js still has placeholder values, the
   whole thing quietly falls back to this browser's localStorage,
   so the site keeps working before Firebase is wired up.
   ============================================================ */

import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, increment,
  collection, query, orderBy, limit, getDocs,
} from 'firebase/firestore/lite';

const LOCAL_KEY = 'hotdog-party-plays';

let db = null;
let mode = 'local';   // 'firebase' | 'local'

function configured() {
  const c = window.FIREBASE_CONFIG;
  return !!(c && c.apiKey && c.projectId && !String(c.apiKey).includes('PASTE'));
}

function init() {
  if (db !== null || mode === 'firebase') return;
  if (!configured()) { mode = 'local'; return; }
  try {
    db = getFirestore(initializeApp(window.FIREBASE_CONFIG));
    mode = 'firebase';
  } catch (err) {
    console.warn('[plays] Firebase init failed, using local counts:', err.message);
    mode = 'local';
  }
}

/* ---------- localStorage fallback ---------- */
const readLocal  = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; } };
const writeLocal = m => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(m)); } catch {} };

/* ---------- public API ---------- */

/** Add one play for a game. Safe to call even if Firebase is down. */
async function recordPlay(slug, title = slug) {
  init();
  if (mode === 'firebase') {
    try {
      await setDoc(doc(db, 'plays', slug), { slug, title, count: increment(1) }, { merge: true });
      return true;
    } catch (err) {
      console.warn('[plays] write failed, counting locally instead:', err.message);
    }
  }
  const m = readLocal();
  m[slug] = { slug, title, count: (m[slug]?.count || 0) + 1 };
  writeLocal(m);
  return false;
}

/** Most played games, highest first: [{ slug, title, count }] */
async function top(n = 10) {
  init();
  if (mode === 'firebase') {
    try {
      const snap = await getDocs(query(collection(db, 'plays'), orderBy('count', 'desc'), limit(n)));
      return snap.docs.map(d => d.data());
    } catch (err) {
      console.warn('[plays] read failed, showing local counts:', err.message);
    }
  }
  return Object.values(readLocal()).sort((a, b) => b.count - a.count).slice(0, n);
}

/** Which backend ended up being used — handy for a status line. */
function source() { init(); return mode; }

/**
 * Start a countdown; when it finishes (and the tab was actually visible for
 * it) the play is recorded. onTick(elapsed, total) runs every 100ms;
 * onDone() runs after the write has actually landed.
 */
function countPlayAfter(slug, title, seconds = 10, onTick = () => {}, onDone = () => {}) {
  let elapsed = 0, done = false;
  onTick(0, seconds);

  const id = setInterval(() => {
    if (document.hidden) return;          // don't count a backgrounded tab
    elapsed += 0.1;
    onTick(Math.min(elapsed, seconds), seconds);
    if (elapsed >= seconds && !done) {
      done = true;
      clearInterval(id);
      recordPlay(slug, title).then(() => onDone(), () => onDone());
    }
  }, 100);

  return { cancel: () => clearInterval(id) };
}

window.Plays = { recordPlay, top, source, countPlayAfter };
