/**
 * The whole build: copy the static page and the engine it imports into `site/`.
 *
 * There is no bundler and no dependency, because there is nothing to bundle —
 * the page loads the same ESM modules the tests run against, directly. That is
 * also the privacy argument: a reader can open the network tab and see that the
 * only requests are for files on this origin.
 */

import { cp, rm, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });
await cp(join(root, 'src'), join(out, 'src'), { recursive: true });

const files = await readdir(out, { recursive: true });
console.log(`site/ built: ${files.length} entries`);
