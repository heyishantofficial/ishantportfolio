// Uploads the encoded media in data/media to a running server's volume.
//
//   npm run media:push -- https://heyishant.com
//
// It proves it's you with the key in .media-key (see scripts/media-key.mjs).
// Only files that are missing on the server, or a different size, are sent.

import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || '').replace(/\/+$/, '');
const keyFile = path.join(ROOT, '.media-key');
const key = fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8').trim() : '';
if (!base || !key) {
  console.error('Usage: npm run media:push -- https://your-site');
  if (!key) console.error('.media-key is missing: restore it from your backup, or run npm run media:key -- --new, then commit and deploy.');
  process.exit(1);
}

const headers = { 'x-media-key': key };
const res = await fetch(`${base}/api/media`, { headers });
if (!res.ok) {
  console.error(`Server said ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const remote = (await res.json()).files;

const local = [];
for (const dir of ['v', 'p', 'files']) {
  const folder = path.join(ROOT, 'data/media', dir);
  for (const name of fs.existsSync(folder) ? fs.readdirSync(folder) : []) {
    if (name.startsWith('.')) continue;
    const size = fs.statSync(path.join(folder, name)).size;
    if (remote[`${dir}/${name}`] !== size) local.push({ dir, name, size });
  }
}

const total = local.reduce((s, f) => s + f.size, 0);
console.log(`${local.length} files to upload (${(total / 1e6).toFixed(0)} MB).`);

let done = 0;
const failed = [];
async function upload(file) {
  const { dir, name, size } = file;
  try {
    const body = Readable.toWeb(fs.createReadStream(path.join(ROOT, 'data/media', dir, name)));
    const r = await fetch(`${base}/api/media/${dir}/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { ...headers, 'content-type': 'application/octet-stream', 'content-length': String(size) },
      body,
      duplex: 'half',
    });
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 160)}`);
    done += 1;
    console.log(`  [${done}/${local.length}] ${dir}/${name} (${(size / 1e6).toFixed(1)} MB)`);
  } catch (err) {
    failed.push(file);
    console.error(`  ✗ ${dir}/${name}: ${err.message}`);
  }
}

const queue = [...local];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) await upload(queue.shift());
  }),
);

// Big files sharing the connection can outlast the proxy's timeout in front of
// the server (it answers 499 or 504). Alone they get the full upload speed.
if (failed.length) {
  const again = failed.splice(0);
  console.log(`Retrying ${again.length} one at a time…`);
  for (const file of again) await upload(file);
}
console.log(failed.length ? `Finished with ${failed.length} failures. Run it again to retry them.` : 'All media is on the server.');
process.exit(failed.length ? 1 : 0);
