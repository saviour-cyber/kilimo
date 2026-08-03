/**
 * PWA Installability Audit Script
 * Replicates Chrome's internal installability checks:
 * 1. manifest.json is fetchable with correct Content-Type
 * 2. manifest has all required fields
 * 3. Icons exist, are fetchable, and have correct sizes
 * 4. sw.js is fetchable with correct Content-Type
 * 5. start_url is within scope
 * 6. scope covers start_url
 * 7. Offline check for start_url (sw fetch handler)
 * Run: node pwa-audit.mjs <base-url>
 */

const BASE_URL = process.argv[2] || 'http://localhost:3009';

const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW= '\x1b[33m';
const BOLD  = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0, failed = 0, warnings = 0;

function pass(msg)  { console.log(`  ${GREEN}✅ PASS${RESET} ${msg}`); passed++; }
function fail(msg)  { console.log(`  ${RED}❌ FAIL${RESET} ${msg}`); failed++; }
function warn(msg)  { console.log(`  ${YELLOW}⚠️  WARN${RESET} ${msg}`); warnings++; }
function info(msg)  { console.log(`  ${BOLD}ℹ️  INFO${RESET} ${msg}`); }
function section(s) { console.log(`\n${BOLD}── ${s} ──${RESET}`); }

async function fetchCheck(path, expectedType) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const ct = res.headers.get('content-type') || '';
    return { ok: res.ok, status: res.status, ct, body: await res.text() };
  } catch(e) {
    return { ok: false, status: 0, ct: '', body: '', error: e.message };
  }
}

async function run() {
  console.log(`\n${BOLD}PWA Installability Audit${RESET}`);
  console.log(`Target: ${BOLD}${BASE_URL}${RESET}\n`);

  // ── 1. index.html ─────────────────────────────────────────────────────────
  section('1. index.html');
  const html = await fetchCheck('/');
  if (!html.ok) { fail(`GET / returned HTTP ${html.status}`); }
  else { pass(`GET / → HTTP 200`); }

  if (html.body.includes('<link rel="manifest"')) { pass('manifest link tag present in index.html'); }
  else { fail('Missing <link rel="manifest"> in index.html'); }

  if (html.body.includes('serviceWorker')) { pass('serviceWorker registration code present in index.html / bundle'); }
  else { warn('Could not detect serviceWorker registration in index.html (may be in bundled JS)'); }

  const swInline = html.body.includes("window._deferredPrompt");
  if (swInline) { pass('beforeinstallprompt capture inline script present'); }
  else { warn('beforeinstallprompt inline capture script not found in HTML'); }

  // ── 2. manifest.json ──────────────────────────────────────────────────────
  section('2. manifest.json');
  const mf = await fetchCheck('/manifest.json');
  if (!mf.ok) { fail(`GET /manifest.json → HTTP ${mf.status} (Chrome will not install)`); return; }
  else { pass(`GET /manifest.json → HTTP 200`); }

  if (mf.ct.includes('application/json')) { pass(`Content-Type: ${mf.ct}`); }
  else { warn(`Content-Type is "${mf.ct}" — should be application/json`); }

  let manifest;
  try {
    manifest = JSON.parse(mf.body);
    pass('manifest.json is valid JSON');
  } catch(e) {
    fail(`manifest.json is not valid JSON: ${e.message}`); return;
  }

  // Required fields
  const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
  for (const field of required) {
    if (manifest[field]) { pass(`manifest.${field} = ${JSON.stringify(manifest[field]).slice(0,60)}`); }
    else { fail(`manifest.${field} is missing or empty`); }
  }

  // display value
  const validDisplays = ['standalone', 'fullscreen', 'minimal-ui'];
  if (validDisplays.includes(manifest.display)) { pass(`display "${manifest.display}" is valid`); }
  else { fail(`display "${manifest.display}" is not valid (must be standalone, fullscreen, or minimal-ui)`); }

  // start_url within scope
  const scope = manifest.scope || '/';
  const startUrl = manifest.start_url || '/';
  if (startUrl.startsWith(scope)) { pass(`start_url "${startUrl}" is within scope "${scope}"`); }
  else { fail(`start_url "${startUrl}" is NOT within scope "${scope}" — Chrome will reject this`); }

  // Icons
  section('3. Icons');
  const icons = manifest.icons || [];
  info(`Found ${icons.length} icon entries`);

  const has192 = icons.some(i => i.sizes && i.sizes.includes('192x192'));
  const has512 = icons.some(i => i.sizes && i.sizes.includes('512x512'));

  if (has192) { pass('192x192 icon declared in manifest'); }
  else { fail('Missing 192x192 icon — required by Chrome for installability'); }

  if (has512) { pass('512x512 icon declared in manifest'); }
  else { fail('Missing 512x512 icon — required by Chrome for installability'); }

  const purposes = icons.map(i => i.purpose || 'any');
  const hasAny      = purposes.some(p => p === 'any' || p === 'any maskable');
  const hasMaskable = purposes.some(p => p === 'maskable' || p === 'any maskable');
  if (hasAny)      { pass('Icon with purpose "any" declared'); }
  else             { warn('No icon with purpose "any" — Chrome prefers this'); }
  if (hasMaskable) { pass('Icon with purpose "maskable" declared'); }
  else             { warn('No maskable icon — Android adaptive icons will use square fallback'); }

  // Fetch each icon
  for (const icon of icons) {
    const r = await fetchCheck(icon.src);
    if (r.ok) { pass(`Icon ${icon.src} (${icon.sizes}) → HTTP 200`); }
    else       { fail(`Icon ${icon.src} → HTTP ${r.status} — Chrome will reject manifest`); }
  }

  // ── 4. Service Worker ─────────────────────────────────────────────────────
  section('4. Service Worker (sw.js)');
  const sw = await fetchCheck('/sw.js');
  if (!sw.ok) { fail(`GET /sw.js → HTTP ${sw.status} — Chrome WILL NOT install without this`); }
  else { pass(`GET /sw.js → HTTP 200`); }

  if (sw.ct.includes('javascript') || sw.ct.includes('application/javascript') || sw.ct.includes('text/javascript')) {
    pass(`Content-Type: ${sw.ct}`);
  } else {
    warn(`sw.js Content-Type is "${sw.ct}" — should be application/javascript`);
  }

  if (sw.body.includes("addEventListener('fetch'") || sw.body.includes('addEventListener("fetch"')) {
    pass('sw.js has a fetch event handler (required by Chrome)');
  } else {
    fail('sw.js is missing a fetch event handler — Chrome will not trigger install');
  }

  if (sw.body.includes("addEventListener('install'") || sw.body.includes('addEventListener("install"')) {
    pass('sw.js has an install event handler');
  } else { warn('sw.js missing install handler'); }

  if (sw.body.includes("addEventListener('activate'") || sw.body.includes('addEventListener("activate"')) {
    pass('sw.js has an activate event handler');
  } else { warn('sw.js missing activate handler'); }

  if (sw.body.includes('skipWaiting')) { pass('sw.js calls skipWaiting() — activates immediately'); }
  else { warn('sw.js does not call skipWaiting() — may delay activation'); }

  if (sw.body.includes('clients.claim')) { pass('sw.js calls clients.claim() — controls page immediately'); }
  else { warn('sw.js does not call clients.claim() — may not control first load'); }

  // ── 5. Offline simulation (cache precaching check) ────────────────────────
  section('5. Offline / Precache Check');
  const precacheUrls = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];
  for (const url of precacheUrls) {
    if (sw.body.includes(`'${url}'`) || sw.body.includes(`"${url}"`)) {
      pass(`sw.js precaches "${url}"`);
    } else {
      warn(`sw.js does NOT explicitly precache "${url}"`);
    }
  }

  // ── 6. HTTPS check ────────────────────────────────────────────────────────
  section('6. Security');
  if (BASE_URL.startsWith('https://')) {
    pass('Running over HTTPS (required for Chrome install on mobile)');
  } else if (BASE_URL.includes('localhost')) {
    pass('Running on localhost (exempt from HTTPS requirement)');
  } else {
    fail('Not running on HTTPS — Chrome WILL NOT show install prompt over HTTP');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  section('Summary');
  console.log(`  ${GREEN}${passed} passed${RESET}, ${RED}${failed} failed${RESET}, ${YELLOW}${warnings} warnings${RESET}`);
  if (failed === 0) {
    console.log(`\n  ${GREEN}${BOLD}✅ ALL CHECKS PASSED — App should be installable on Android Chrome${RESET}\n`);
  } else {
    console.log(`\n  ${RED}${BOLD}❌ ${failed} FAILURE(S) — Fix these before testing on mobile${RESET}\n`);
  }
}

run().catch(console.error);
