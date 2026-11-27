// Uploads the encoded media in data/media to a running server's volume.
//
//   ADMIN_PASSWORD=... npm run media:push -- https://new.heyishant.com
//
// Only files that are missing on the server, or a different size, are sent.

import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || '').replace(/\/+$/, '');
const password = process.env.ADMIN_PASSWORD;
if (!base || !password) {
  console.error('Usage: ADMIN_PASSWORD=... npm run media:push -- https://your-site');
  process.exit(1);
}

const headers = { 'x-admin-password': password };
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
let failed = 0;
async function upload({ dir, name, size }) {
  const body = Readable.toWeb(fs.createReadStream(path.join(ROOT, 'data/media', dir, name)));
  const r = await fetch(`${base}/api/media/${dir}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { ...headers, 'content-type': 'application/octet-stream', 'content-length': String(size) },
    body,
    duplex: 'half',
  });
  done += 1;
  if (!r.ok) {
    failed += 1;
    console.error(`  ✗ ${dir}/${name}: ${r.status} ${await r.text()}`);
  } else console.log(`  [${done}/${local.length}] ${dir}/${name} (${(size / 1e6).toFixed(1)} MB)`);
}

const queue = [...local];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) await upload(queue.shift());
  }),
);
console.log(failed ? `Finished with ${failed} failures.` : 'All media is on the server.');
process.exit(failed ? 1 : 0);
