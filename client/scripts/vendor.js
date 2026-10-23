// Copies the browser builds of the motion libraries into client/vendor/
// so the static Express server can serve them (no bundler, no CDN).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'vendor');
fs.mkdirSync(out, { recursive: true });
const files = [
  ['node_modules/gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['node_modules/gsap/dist/ScrollTrigger.min.js', 'ScrollTrigger.min.js'],
  ['node_modules/lenis/dist/lenis.min.js', 'lenis.min.js']
];
// Self-hosted fonts (no third-party font requests; works offline in the PWA).
const fontDir = path.join(root, 'fonts');
fs.mkdirSync(fontDir, { recursive: true });
const fonts = [
  '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2',
  '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-standard-normal.woff2',
  '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2',
  '@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-italic.woff2',
  '@fontsource-variable/readex-pro/files/readex-pro-arabic-wght-normal.woff2'
];
for (const f of fonts) {
  const src = path.join(root, 'node_modules', f);
  if (!fs.existsSync(src)) { console.warn('[vendor] missing font', f); continue; }
  fs.copyFileSync(src, path.join(fontDir, path.basename(f)));
  console.log('[vendor]', f, '-> fonts/' + path.basename(f));
}
for (const [from, to] of files) {
  const src = path.join(root, from);
  if (!fs.existsSync(src)) { console.warn('[vendor] missing', from, '- run npm install in client/'); continue; }
  fs.copyFileSync(src, path.join(out, to));
  console.log('[vendor]', from, '->', 'vendor/' + to);
}
