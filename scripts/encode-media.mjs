// Turns the original media files into what the site serves.
//
//   npm run media:encode                       everything new or changed
//   npm run media:encode -- --only ck-001,me-cat
//   npm run media:encode -- --force            redo everything
//   npm run media:encode -- --src ../some/folder
//
// Sources: scripts/media-sources.json maps an id to a file inside the source
// folder (default: ../heyishant-live-export, the export of the old site).
//
// Outputs
//   data/media/v/<id>.mp4        full video, 720p H.264, fast start   (server volume)
//   data/media/p/<id>.mp4        5 s muted preview loop, 360p          (server volume)
//   data/media/files/<id>.pdf    documents                            (server volume)
//   public/img/poster/<id>.webp  poster frame for each video          (git)
//   public/img/photo/<id>-<w>.webp  photos at 640 and 1280 wide       (git)
//   public/img/yt/<youtubeId>.webp  YouTube thumbnails                 (git)
//   content/media.json           sizes, durations and cache keys the pages read
//
// A video that is already smaller than its re-encode keeps its original
// picture and is only re-packed for fast start, so nothing gets bigger.
//
// Needs ffmpeg, ffprobe and cwebp on the PATH (brew install ffmpeg webp).
// The encoding itself is server/media-encode.mjs, which the CMS uses too.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_EXT, VIDEO_EXT, encodeImage, encodeVideo, fileHash, youtubeThumb } from '../server/media-encode.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const SRC = path.resolve(ROOT, arg('src', '../heyishant-live-export'));
const FORCE = args.includes('--force');
const ONLY = arg('only', '') ? new Set(arg('only', '').split(',')) : null;

const MEDIA = path.join(ROOT, 'data/media');
const IMG = path.join(ROOT, 'public/img');
const META_FILE = path.join(ROOT, 'content/media.json');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'encode-media-'));

const sources = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/media-sources.json'), 'utf8'));
const meta = fs.existsSync(META_FILE) ? JSON.parse(fs.readFileSync(META_FILE, 'utf8')) : {};
meta.videos ??= {};
meta.images ??= {};
meta.files ??= {};
meta.youtube ??= {};

for (const dir of ['v', 'p', 'files']) fs.mkdirSync(path.join(MEDIA, dir), { recursive: true });
for (const dir of ['poster', 'photo', 'yt']) fs.mkdirSync(path.join(IMG, dir), { recursive: true });

// `next dev` serves public/, so link public/media to the encoded files to play them locally.
const devLink = path.join(ROOT, 'public/media');
if (!fs.existsSync(devLink)) fs.symlinkSync('../data/media', devLink);

const size = (file) => fs.statSync(file).size;
const fresh = (outputs, source) => !FORCE && outputs.every((o) => fs.existsSync(o) && fs.statSync(o).mtimeMs >= fs.statSync(source).mtimeMs);

async function video(id, src) {
  const full = path.join(MEDIA, 'v', `${id}.mp4`);
  const preview = path.join(MEDIA, 'p', `${id}.mp4`);
  const poster = path.join(IMG, 'poster', `${id}.webp`);
  if (fresh([full, preview, poster], src) && meta.videos[id]) return 'cached';
  meta.videos[id] = await encodeVideo(src, { full, preview, poster, tmpDir: TMP });
  return meta.videos[id].original ? 'kept original' : 'encoded';
}

async function image(id, src) {
  const big = path.join(IMG, 'photo', `${id}-1280.webp`);
  const small = path.join(IMG, 'photo', `${id}-640.webp`);
  if (fresh([big, small], src) && meta.images[id]) return 'cached';
  meta.images[id] = await encodeImage(src, { big, small, tmpDir: TMP });
  return 'encoded';
}

async function copyFile(id, src) {
  const out = path.join(MEDIA, 'files', `${id}${path.extname(src).toLowerCase()}`);
  if (fresh([out], src) && meta.files[id]) return 'cached';
  fs.copyFileSync(src, out);
  meta.files[id] = { ext: path.extname(src).toLowerCase(), bytes: size(out), v: await fileHash(out) };
  return 'copied';
}

async function youtubeThumbs() {
  const works = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/data/works.json'), 'utf8'));
  const rows = works.filter((w) => w.youtubeId).map((w) => ({ id: w.youtubeId, short: Boolean(w.short) }));
  let fetched = 0;
  for (const { id, short } of rows) {
    if (ONLY && !ONLY.has(id)) continue;
    const out = path.join(IMG, 'yt', `${id}.webp`);
    if (!FORCE && fs.existsSync(out) && meta.youtube[id]) continue;
    const entry = await youtubeThumb(id, short, out, { tmpDir: TMP });
    if (!entry) {
      console.warn(`  ! no thumbnail for YouTube ${id}`);
      continue;
    }
    meta.youtube[id] = entry;
    fetched += 1;
  }
  return fetched;
}

const ids = Object.keys(sources).filter((id) => !ONLY || ONLY.has(id));
let n = 0;
for (const id of ids) {
  n += 1;
  const src = path.join(SRC, sources[id]);
  if (!fs.existsSync(src)) { console.warn(`  ! ${id}: source not found (${sources[id]})`); continue; }
  const ext = path.extname(src).toLowerCase();
  const t0 = Date.now();
  let result;
  try {
    if (VIDEO_EXT.has(ext)) result = await video(id, src);
    else if (IMAGE_EXT.has(ext)) result = await image(id, src);
    else result = await copyFile(id, src);
  } catch (err) {
    console.error(`  ✗ ${id}: ${err.stderr?.toString() || err.message}`);
    continue;
  }
  console.log(`[${n}/${ids.length}] ${id}: ${result} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2) + '\n');
}

const thumbs = await youtubeThumbs();
console.log(`YouTube thumbnails fetched: ${thumbs}`);

// Keep the file stable and readable: sort every section by id.
for (const key of ['videos', 'images', 'files', 'youtube']) {
  meta[key] = Object.fromEntries(Object.entries(meta[key]).sort(([a], [b]) => a.localeCompare(b)));
}
fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2) + '\n');
fs.rmSync(TMP, { recursive: true, force: true });

const total = Object.values(meta.videos).reduce((s, v) => s + v.bytes, 0);
console.log(`Done. ${Object.keys(meta.videos).length} videos (${(total / 1e6).toFixed(0)} MB), ${Object.keys(meta.images).length} photos, ${Object.keys(meta.youtube).length} YouTube thumbnails.`);
