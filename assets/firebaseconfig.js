/* ============================================================
   Firebase config for Hotdog Party
   ------------------------------------------------------------
   These keys are meant to be public — Firebase security comes
   from the Firestore rules, not from hiding this file.

   Play counts are stored as one document per game in a "plays"
   collection. If this config is ever removed or wrong, the site
   quietly falls back to counting in each visitor's own browser.
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCgXoy3reuv0-JPB8oGgugwPIN9z9w2TwU",
  authDomain:        "hotdog-party-v2.firebaseapp.com",
  projectId:         "hotdog-party-v2",
  storageBucket:     "hotdog-party-v2.firebasestorage.app",
  messagingSenderId: "85266780201",
  appId:             "1:85266780201:web:22ea4d17225d63a6290c38",
  measurementId:     "G-LW7B9MB4EL",
};
