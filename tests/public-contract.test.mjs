import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homepage states the verification job and local-only boundary", async () => {
  const page = await source("app/page.tsx");
  const check = await source("components/reality-check.tsx");

  assert.match(page, /Reality is no longer a given/i);
  assert.match(page, /Reality Check/);
  assert.match(check, /Nothing is uploaded or stored/i);
  assert.match(check, /evaluateRealityCheck/);
});

test("moves focus to the result after evaluation", async () => {
  const check = await source("components/reality-check.tsx");

  assert.match(check, /useEffect/);
  assert.match(check, /resultRef\.current\?\.focus\(\)/);
});

test("discovery surfaces identify the canonical standalone project", async () => {
  const layout = await source("app/layout.tsx");
  const robots = await source("app/robots.ts");
  const sitemap = await source("app/sitemap.ts");
  const llms = await source("public/llms.txt");

  for (const content of [layout, robots, sitemap, llms]) {
    assert.match(content, /realitydiffusion\.ai/i);
  }
  assert.match(llms, /synthetic media/i);
  assert.match(llms, /does not accept media uploads/i);
});

test("ships first-party social and install metadata", async () => {
  const layout = await source("app/layout.tsx");
  const social = await source("app/opengraph-image.tsx");
  const manifest = await source("app/manifest.ts");

  assert.match(layout, /manifest\.webmanifest/);
  assert.match(social, /Reality Diffusion/);
  assert.match(social, /Evidence is a practice/);
  assert.match(manifest, /Synthetic Media Intelligence/);
  assert.match(manifest, /standalone/);
});

test("deployment config supplies baseline security headers", async () => {
  const config = await source("next.config.mjs");

  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /Referrer-Policy/);
  assert.match(config, /Permissions-Policy/);
});
