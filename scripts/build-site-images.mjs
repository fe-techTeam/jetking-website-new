#!/usr/bin/env node
/**
 * Lists every image shipped in public/ so the admin Media library can show (and let editors pick) the
 * website's existing images next to uploaded ones. Writes src/content/site-images.json.
 * Runs automatically before `npm run build`; run `npm run build:site-images` after adding files locally.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);
const out = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push({ path: '/' + path.relative(PUBLIC, full).split(path.sep).join('/'), size: fs.statSync(full).size });
    }
  }
}
walk(PUBLIC);
out.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(path.join(ROOT, 'src/content/site-images.json'), JSON.stringify(out) + '\n');
console.log(`Listed ${out.length} site images.`);
