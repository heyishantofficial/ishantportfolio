// Turns original media into what the site serves. Shared by the command-line
// encoder (scripts/encode-media.mjs) and the CMS (server/cms.mjs). Everything is
// async (child processes), so the server keeps answering while a video encodes.
//
// Needs ffmpeg, ffprobe and cwebp on the PATH.

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm']);
export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.avif', '.tif', '.tiff']);

/** Runs a command; resolves with stdout, rejects with stderr. onLine gets each stdout line. */
export function run(cmd, args, { onLine } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    let partial = '';
    child.stdout.on('data', (d) => {
      const s = d.toString();
      out += s;
      if (onLine) {
        const lines = (partial + s).split('\n');
        partial = lines.pop() ?? '';
        for (const l of lines) onLine(l);
      }
    });
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', (e) => reject(new Error(e.code === 'ENOENT' ? `${cmd} is not installed on this machine.` : e.message)));
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(Object.assign(new Error(err.trim().split('\n').slice(-3).join(' ') || `${cmd} failed (${code})`), { stderr: err }))));
  });
}

const ffmpeg = (args, opts) => run('ffmpeg', ['-v', 'error', '-nostdin', '-y', ...args], opts);
export const fileHash = async (file) => crypto.createHash('sha1').update(await fsp.readFile(file)).digest('hex').slice(0, 8);
export const fileSize = async (file) => (await fsp.stat(file)).size;

export async function probe(file) {
  const info = JSON.parse(await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file]));
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  if (!v) throw new Error('This file has no picture in it.');
  let rotation = 0;
  for (const sd of v.side_data_list ?? []) if (typeof sd.rotation === 'number') rotation = sd.rotation;
  if (v.tags?.rotate) rotation = Number(v.tags.rotate);
  const turned = Math.abs(rotation) % 180 === 90;
  return {
    w: turned ? v.height : v.width,
    h: turned ? v.width : v.height,
    duration: Number(info.format.duration) || 0,
    frames: Number(v.nb_frames) || 0,
    /** A photo (JPEG, PNG, WebP…) rather than a moving picture. */
    still: /(^|,)image2(,|$)|_pipe$/.test(info.format.format_name ?? '') || Number(v.nb_frames) === 1,
    videoCodec: v.codec_name,
    audioCodec: a?.codec_name ?? null,
  };
}

/** EXIF orientation (1–8) of a JPEG, or 1. Phones store "rotate me" here instead of turning the pixels. */
export async function jpegOrientation(file) {
  const fd = await fsp.open(file, 'r');
  try {
    const { buffer: b, bytesRead } = await fd.read(Buffer.alloc(128 * 1024), 0, 128 * 1024, 0);
    if (bytesRead < 4 || b[0] !== 0xff || b[1] !== 0xd8) return 1;
    let i = 2;
    while (i + 4 < bytesRead) {
      if (b[i] !== 0xff) return 1;
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker === 0xe1 && b.toString('latin1', i + 4, i + 10) === 'Exif\0\0') {
        const t = i + 10;
        const le = b.toString('latin1', t, t + 2) === 'II';
        const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
        const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
        const ifd = t + u32(t + 4);
        const count = u16(ifd);
        for (let k = 0; k < count; k++) {
          const e = ifd + 2 + k * 12;
          if (e + 10 > bytesRead) return 1;
          if (u16(e) === 0x0112) return u16(e + 8) || 1;
        }
        return 1;
      }
      if (marker === 0xda) return 1;
      i += 2 + len;
    }
    return 1;
  } catch {
    return 1;
  } finally {
    await fd.close();
  }
}

const ORIENT_FILTER = { 2: 'hflip', 3: 'hflip,vflip', 4: 'vflip', 5: 'transpose=0', 6: 'transpose=1', 7: 'transpose=3', 8: 'transpose=2' };

/**
 * Any still image → a PNG with its pixels upright, so cwebp (which ignores EXIF
 * and reads only JPEG, PNG, TIFF and WebP) gets something it understands.
 */
async function uprightPng(src, tmpDir) {
  const ext = path.extname(src).toLowerCase();
  const orientation = ext === '.jpg' || ext === '.jpeg' ? await jpegOrientation(src) : 1;
  if (orientation === 1 && ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'].includes(ext)) return src;
  const out = path.join(tmpDir, `${crypto.randomBytes(6).toString('hex')}.png`);
  const vf = ORIENT_FILTER[orientation];
  // -noautorotate: we apply EXIF ourselves, so newer ffmpeg builds don't turn it twice.
  await ffmpeg(['-noautorotate', '-i', src, ...(vf ? ['-vf', vf] : []), '-frames:v', '1', out]);
  return out;
}

export async function toWebp(input, output, width, quality = 78) {
  await fsp.mkdir(path.dirname(output), { recursive: true });
  await run('cwebp', ['-quiet', '-q', String(quality), '-resize', String(width), '0', '-metadata', 'none', input, '-o', output]);
}

/**
 * A video → 720p H.264 (or the original, re-packed, when that's smaller), a 5 s
 * muted 360p preview loop and a WebP poster. Returns the media.json entry.
 * onProgress(0..1) follows the main encode.
 */
export async function encodeVideo(src, { full, preview, poster, tmpDir, preset = 'medium', onProgress }) {
  for (const f of [full, preview, poster]) await fsp.mkdir(path.dirname(f), { recursive: true });
  const p = await probe(src);
  if (!p.duration || p.still) throw new Error('This looks like a photo, not a video.');
  const vertical = p.h > p.w;
  const scale = vertical ? "scale='min(720,iw)':-2" : "scale=-2:'min(720,ih)'";
  const audio = p.audioCodec ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an'];
  const progress = onProgress
    ? {
        onLine: (l) => {
          const m = /^out_time_us=(\d+)/.exec(l);
          if (m && p.duration) onProgress(Math.min(1, Number(m[1]) / 1e6 / p.duration));
        },
      }
    : undefined;
  // Everything is written next to its final name first and moved into place at
  // the end, so a failed encode never leaves a half-written file (or replaces a good one).
  const tag = crypto.randomBytes(4).toString('hex');
  const tmp = { full: `${full}.${tag}.mp4`, preview: `${preview}.${tag}.mp4`, poster: `${poster}.${tag}.webp` };
  const frame = path.join(tmpDir, `${tag}.png`);
  try {
    await ffmpeg(
      ['-i', src, '-vf', scale, '-c:v', 'libx264', '-preset', preset, '-crf', '25', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...audio, '-movflags', '+faststart', ...(onProgress ? ['-progress', 'pipe:1', '-nostats'] : []), tmp.full],
      progress,
    );
    let kept = false;
    if ((await fileSize(tmp.full)) >= (await fileSize(src)) && p.videoCodec === 'h264' && (!p.audioCodec || p.audioCodec === 'aac')) {
      await ffmpeg(['-i', src, '-c', 'copy', '-movflags', '+faststart', '-f', 'mp4', tmp.full]);
      kept = true;
    }

    const pscale = vertical ? 'scale=360:-2' : 'scale=-2:360';
    await ffmpeg(['-ss', String(Math.min(1, p.duration * 0.1)), '-t', '5', '-i', src, '-vf', `${pscale},fps=24`, '-an', '-c:v', 'libx264', '-preset', preset, '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp.preview]);

    await ffmpeg(['-ss', String(Math.min(1, p.duration / 3)), '-i', src, '-frames:v', '1', frame]);
    await toWebp(frame, tmp.poster, vertical ? 720 : 960, 72);

    const out = await probe(tmp.full);
    const entry = {
      w: out.w,
      h: out.h,
      duration: Math.round(out.duration * 10) / 10,
      bytes: await fileSize(tmp.full),
      audio: Boolean(p.audioCodec),
      v: await fileHash(tmp.full),
      ...(kept ? { original: true } : {}),
    };
    await fsp.rename(tmp.full, full);
    await fsp.rename(tmp.preview, preview);
    await fsp.rename(tmp.poster, poster);
    return entry;
  } finally {
    await Promise.all([...Object.values(tmp), frame].map((f) => fsp.rm(f, { force: true })));
  }
}

/** A photo → WebP at 1280 and 640 px wide (never upscaled). Returns the media.json entry. */
export async function encodeImage(src, { big, small, tmpDir }) {
  const input = await uprightPng(src, tmpDir);
  try {
    const p = await probe(input);
    await toWebp(input, big, Math.min(1280, p.w));
    await toWebp(input, small, Math.min(640, p.w));
    const out = await probe(big);
    return { w: out.w, h: out.h, v: await fileHash(big) };
  } finally {
    if (input !== src) await fsp.rm(input, { force: true });
  }
}

/** A picture for a Writing post → one WebP, at most maxWidth wide. GIFs are kept as they are (they may move). */
export async function encodePostImage(src, out, { tmpDir, maxWidth = 1600 }) {
  if (path.extname(src).toLowerCase() === '.gif') {
    await fsp.mkdir(path.dirname(out), { recursive: true });
    await fsp.copyFile(src, out);
    return;
  }
  const input = await uprightPng(src, tmpDir);
  try {
    const p = await probe(input);
    await toWebp(input, out, Math.min(maxWidth, p.w), 80);
  } finally {
    if (input !== src) await fsp.rm(input, { force: true });
  }
}

/** A YouTube video's thumbnail, cropped to the video's real shape. Returns the media.json entry, or null. */
export async function youtubeThumb(id, short, out, { tmpDir }) {
  let buf = null;
  for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`).catch(() => null);
    if (!res?.ok) continue;
    const b = Buffer.from(await res.arrayBuffer());
    if (b.length > 2000) {
      buf = b;
      break;
    }
  }
  if (!buf) return null;
  const tag = crypto.randomBytes(6).toString('hex');
  const jpg = path.join(tmpDir, `${tag}.jpg`);
  const png = path.join(tmpDir, `${tag}.png`);
  await fsp.writeFile(jpg, buf);
  // Thumbnails come letterboxed; crop to the video's real shape.
  await ffmpeg(['-i', jpg, '-vf', short ? 'crop=ih*9/16:ih' : 'crop=iw:iw*9/16', png]);
  await toWebp(png, out, short ? 540 : 960, 74);
  await Promise.all([fsp.rm(jpg, { force: true }), fsp.rm(png, { force: true })]);
  const p = await probe(out);
  return { w: p.w, h: p.h, short: Boolean(short) };
}

export const exists = (f) => fs.existsSync(f);
