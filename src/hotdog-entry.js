import { mountHotdog } from './hotdog.js';

// Exposed as a plain global so the pages can use a normal <script> tag.
// (ES modules don't load from file:// URLs, which broke local previews.)
window.mountHotdog = mountHotdog;
