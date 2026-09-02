import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const app = read('public/app.js');
const html = read('public/index.html');
const vercel = JSON.parse(read('vercel.json'));

test('the workbench cannot talk to the network', () => {
  for (const api of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'new WebSocket', 'EventSource', 'navigator.geolocation']) {
    assert.ok(!app.includes(api), `public/app.js references ${api}; the page must make no network call`);
  }
  for (const m of app.matchAll(/from\s+'([^']+)'/g)) {
    assert.ok(m[1].startsWith('./'), `public/app.js imports ${m[1]} from outside this origin`);
  }
  assert.ok(!/<script[^>]+src=["']https?:/i.test(html), 'index.html loads a remote script');
  assert.ok(!/<link[^>]+href=["']https?:/i.test(html), 'index.html loads a remote stylesheet');
  assert.ok(!/<form/i.test(html), 'index.html contains a form; nothing on this page submits anywhere');
});

test('the page ships a content security policy that forbids connections, inline script and forms', () => {
  const meta = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(meta, 'no CSP meta tag');
  for (const directive of ["default-src 'none'", "script-src 'self'", "connect-src 'none'", "form-action 'none'", "frame-ancestors 'none'"]) {
    assert.ok(meta[1].includes(directive), `CSP is missing ${directive}`);
  }
  assert.ok(!meta[1].includes("unsafe-inline"), 'CSP allows inline script or style');
  const header = vercel.headers[0].headers.find((h) => h.key === 'Content-Security-Policy');
  assert.equal(header.value, meta[1], 'the served header and the meta tag must state the same policy');
});

test('the static surface asks for no money and captures no address', () => {
  assert.ok(!/type="email"|checkout|Buy now|Add to cart|price/i.test(html), 'the page must not sell or capture until demand capture is wired');
  assert.match(html, /waitlist opens with the public preview/i);
});

test('the page states the no-detection-claim boundary where a reader will see it', () => {
  assert.match(html, /makes no detection claim|no detection claim/i);
  assert.match(html, /BENCHMARK-PLAN\.md/);
});

test('the build copies the engine the page imports', () => {
  const build = read('scripts/build-site.mjs');
  assert.match(build, /'src'/);
  assert.equal(vercel.outputDirectory, 'site');
  assert.equal(vercel.framework, null);
});
