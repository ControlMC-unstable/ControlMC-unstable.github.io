/* ============================================================
   PASTE YOUR FIREBASE CONFIG HERE
   ------------------------------------------------------------
   Firebase console → Project settings (gear icon) → scroll to
   "Your apps" → the web app → "SDK setup and configuration"
   → Config. Copy the object it shows you over the one below.

   Until you do, play counts are stored in each visitor's own
   browser instead, so nothing breaks — the numbers just aren't
   shared between people.

   These keys are meant to be public; Firebase security comes
   from the database rules, not from hiding the config. See the
   README for the rules to paste into the console.
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:0000000000000000000000",
};
