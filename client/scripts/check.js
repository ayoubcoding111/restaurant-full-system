// "Build" check for the zero-build client: syntax-checks every script,
// verifies local asset references and that every data-i18n key exists.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
let failed = 0;
const fail = (m) => { failed++; console.error('✗', m); };
const ok = (m) => console.log('✓', m);

// 1) JS syntax
const jsFiles = fs.readdirSync(root).filter((f) => f.endsWith('.js'));
for (const f of jsFiles) {
  try { execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'pipe' }); }
  catch (e) { fail(`syntax: ${f}\n${e.stderr}`); }
}
ok(`syntax checked ${jsFiles.length} scripts`);

// 2) Local references in HTML + CSS
const refs = [];
for (const page of ['index.html', 'admin.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const m of html.matchAll(/(?:src|href|srcset|imagesrcset)="([^"]+)"/g)) {
    m[1].split(',').map((s) => s.trim().split(/\s+/)[0]).forEach((u) => refs.push([page, u]));
  }
}
const css = fs.readFileSync(path.join(root, 'site.css'), 'utf8');
for (const m of css.matchAll(/url\("?([^")]+)"?\)/g)) refs.push(['site.css', m[1]]);
let checked = 0;
for (const [from, u] of refs) {
  if (!u || /^(https?:|mailto:|tel:|data:|#|\/$)/.test(u) || u === '/') continue;
  const clean = u.split('?')[0].replace(/^\//, '');
  checked++;
  if (!fs.existsSync(path.join(root, clean))) fail(`missing asset ${u} (referenced in ${from})`);
}
ok(`checked ${checked} local asset references`);

// 3) i18n keys
global.localStorage = { getItem: () => null, setItem() {} };
global.document = { documentElement: {}, querySelectorAll: () => [], getElementById: () => null };
const I18n = new Function(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8') + '; return I18n;')();
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const keys = new Set([...html.matchAll(/data-i18n(?:-ph|-aria|-title)?="([^"]+)"/g)].map((m) => m[1]));
const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8') + fs.readFileSync(path.join(root, 'track.js'), 'utf8');
for (const m of appSrc.matchAll(/I18n\.t\('([a-z0-9_]+)'\)/g)) keys.add(m[1]);
for (const k of keys) {
  if (!I18n.dict.en[k]) fail(`i18n key missing in en: ${k}`);
  for (const l of ['fr', 'ar']) if (!I18n.dict[l][k]) console.warn(`  (falls back to English) ${l}.${k}`);
}
ok(`checked ${keys.size} i18n keys`);

if (failed) { console.error(`\n${failed} problem(s) found`); process.exit(1); }
console.log('\nAll checks passed.');
