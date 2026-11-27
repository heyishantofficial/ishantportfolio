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

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

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

const run = (cmd, argv) => execFileSync(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const ffmpeg = (argv) => run('ffmpeg', ['-v', 'error', '-nostdin', '-y', ...argv]);
const hash = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
const size = (file) => fs.statSync(file).size;
const fresh = (outputs, source) => !FORCE && outputs.every((o) => fs.existsSync(o) && fs.statSync(o).mtimeMs >= fs.statSync(source).mtimeMs);

function probe(file) {
  const info = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]));
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  let rotation = 0;
  for (const sd of v?.side_data_list ?? []) if (typeof sd.rotation === 'number') rotation = sd.rotation;
  if (v?.tags?.rotate) rotation = Number(v.tags.rotate);
  const turned = Math.abs(rotation) % 180 === 90;
  return {
    w: turned ? v.height : v.width,
    h: turned ? v.width : v.height,
    duration: Number(info.format.duration) || 0,
    videoCodec: v?.codec_name,
    audioCodec: a?.codec_name ?? null,
  };
}

function toWebp(input, output, width, quality = 78) {
  run('cwebp', ['-quiet', '-q', String(quality), '-resize', String(width), '0', '-metadata', 'none', input, '-o', output]);
}

function encodeVideo(id, src) {
  const full = path.join(MEDIA, 'v', `${id}.mp4`);
  const preview = path.join(MEDIA, 'p', `${id}.mp4`);
  const poster = path.join(IMG, 'poster', `${id}.webp`);
  if (fresh([full, preview, poster], src) && meta.videos[id]) return 'cached';

  const p = probe(src);
  const vertical = p.h > p.w;
  const scale = vertical ? "scale='min(720,iw)':-2" : "scale=-2:'min(720,ih)'";
  const audio = p.audioCodec ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an'];
  ffmpeg(['-i', src, '-vf', scale, '-c:v', 'libx264', '-preset', 'medium', '-crf', '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...audio, '-movflags', '+faststart', full]);

  let kept = false;
  if (size(full) >= size(src) && p.videoCodec === 'h264' && (!p.audioCodec || p.audioCodec === 'aac')) {
    ffmpeg(['-i', src, '-c', 'copy', '-movflags', '+faststart', full]);
    kept = true;
  }

  const start = Math.min(1, p.duration * 0.1);
  const pscale = vertical ? 'scale=360:-2' : 'scale=-2:360';
  ffmpeg(['-ss', String(start), '-t', '5', '-i', src, '-vf', `${pscale},fps=24`, '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', preview]);

  const frame = path.join(TMP, `${id}.png`);
  ffmpeg(['-ss', String(Math.min(1, p.duration / 3)), '-i', src, '-frames:v', '1', frame]);
  toWebp(frame, poster, vertical ? 720 : 960, 72);

  const out = probe(full);
  meta.videos[id] = { w: out.w, h: out.h, duration: Math.round(out.duration * 10) / 10, bytes: size(full), audio: Boolean(p.audioCodec), v: hash(full), ...(kept ? { original: true } : {}) };
  return kept ? 'kept original' : 'encoded';
}

function encodeImage(id, src) {
  const big = path.join(IMG, 'photo', `${id}-1280.webp`);
  const small = path.join(IMG, 'photo', `${id}-640.webp`);
  if (fresh([big, small], src) && meta.images[id]) return 'cached';
  const p = probe(src);
  toWebp(src, big, Math.min(1280, p.w));
  toWebp(src, small, Math.min(640, p.w));
  const out = probe(big);
  meta.images[id] = { w: out.w, h: out.h, v: hash(big) };
  return 'encoded';
}

function copyFile(id, src) {
  const out = path.join(MEDIA, 'files', `${id}${path.extname(src).toLowerCase()}`);
  if (fresh([out], src) && meta.files[id]) return 'cached';
  fs.copyFileSync(src, out);
  meta.files[id] = { ext: path.extname(src).toLowerCase(), bytes: size(out), v: hash(out) };
  return 'copied';
}

async function youtubeThumbs() {
  const works = fs.readFileSync(path.join(ROOT, 'content/works.ts'), 'utf8');
  const rows = [...works.matchAll(/youtubeId: "([^"]+)"([^\n]*)/g)].map((m) => ({ id: m[1], short: /short: true/.test(m[2]) }));
  let fetched = 0;
  for (const { id, short } of rows) {
    if (ONLY && !ONLY.has(id)) continue;
    const out = path.join(IMG, 'yt', `${id}.webp`);
    if (!FORCE && fs.existsSync(out) && meta.youtube[id]) continue;
    let buf = null;
    for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
      const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`);
      if (!res.ok) continue;
      const b = Buffer.from(await res.arrayBuffer());
      if (b.length > 2000) { buf = b; break; }
    }
    if (!buf) { console.warn(`  ! no thumbnail for YouTube ${id}`); continue; }
    const jpg = path.join(TMP, `${id}.jpg`);
    fs.writeFileSync(jpg, buf);
    // Thumbnails come letterboxed; crop to the video's real shape.
    const crop = short ? 'crop=ih*9/16:ih' : 'crop=iw:iw*9/16';
    const png = path.join(TMP, `${id}.png`);
    ffmpeg(['-i', jpg, '-vf', crop, png]);
    toWebp(png, out, short ? 540 : 960, 74);
    const p = probe(out);
    meta.youtube[id] = { w: p.w, h: p.h, short };
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
    if (VIDEO_EXT.has(ext)) result = encodeVideo(id, src);
    else if (IMAGE_EXT.has(ext)) result = encodeImage(id, src);
    else result = copyFile(id, src);
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
