// Creates the key that lets `npm run media:push` upload videos to the server.
//
//   npm run media:key            make a key if there is none yet
//   npm run media:key -- --new   replace it (then commit and redeploy)
//
// The key itself stays on this computer in .media-key, which git ignores. Keep
// a copy in your password manager. Only its SHA-256 goes into git, in
// server/media-key.sha256. That is safe in a public repo: the server checks an
// upload's key against it, and the key can't be worked out from it.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY_FILE = path.join(ROOT, '.media-key');
const HASH_FILE = path.join(ROOT, 'server/media-key.sha256');

if (fs.existsSync(KEY_FILE) && !process.argv.includes('--new')) {
  console.log('.media-key already exists (use --new to replace it).');
} else {
  fs.writeFileSync(KEY_FILE, `${crypto.randomBytes(32).toString('hex')}\n`, { mode: 0o600 });
  console.log('Wrote a new key to .media-key. Keep it private and back it up.');
}

const key = fs.readFileSync(KEY_FILE, 'utf8').trim();
fs.writeFileSync(HASH_FILE, `${crypto.createHash('sha256').update(key).digest('hex')}\n`);
console.log('Wrote its fingerprint to server/media-key.sha256. Commit it and deploy, and the server will accept the key.');
