// Downloads everything on the live site into real folders on this computer.
//
//   node scripts/export-live-site.mjs [siteUrl] [outDir]
//
// The live folder tree is the built-in tree in src/data/ishantOS.js with the
// admin's changes (new folders, uploads, renames, deletions, edited text)
// layered on top from /api/filesystem. This loads that same module through
// Vite and replays the same rebuildFSTree() the browser runs, so the export
// matches what visitors see. Re-running skips files already downloaded.

import { createServer } from 'vite';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'https://heyishant.com').replace(/\/+$/, '');
const OUT = path.resolve(process.argv[3] || path.join(ROOT, '..', 'heyishant-live-export'));
const SITE_DATA = path.join(OUT, '_site-data');
const CONCURRENCY = 4;

const failures = [];
const downloads = [];
const counts = { folders: 0, notes: 0, files: 0, links: 0, other: 0, previewsOnly: 0 };
const indexLines = [];
// folder path -> [{ name, href, description }], written as links.txt in each folder
const linksByFolder = new Map();

async function getJson(route) {
  const res = await fetch(BASE + route, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error(`${route} answered ${res.status}`);
  return res.json();
}

function safeName(name) {
  const cleaned = String(name || '')
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[. ]+$/, '');
  return (cleaned || 'untitled').slice(0, 150);
}

// macOS folders are case-insensitive, so two items named "Notes" and "notes"
// would overwrite each other without this.
const takenByDir = new Map();
function claim(dir, fileName) {
  const taken = takenByDir.get(dir) || new Set();
  takenByDir.set(dir, taken);
  const ext = path.extname(fileName);
  const stem = ext ? fileName.slice(0, -ext.length) : fileName;
  let candidate = fileName;
  for (let n = 2; taken.has(candidate.toLowerCase()); n += 1) candidate = `${stem} (${n})${ext}`;
  taken.add(candidate.toLowerCase());
  return path.join(dir, candidate);
}

function withExt(name, ext) {
  if (!ext) return name;
  return path.extname(name).toLowerCase() === ext.toLowerCase() ? name : name + ext;
}

const isData = (v) => typeof v === 'string' && v.startsWith('data:');
const isSiteFile = (v) => typeof v === 'string' && (v.startsWith('/uploads/') || /^\/[^/]/.test(v) && /\.[a-z0-9]{2,5}$/i.test(v));
const isWeb = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);

function extFromUrl(url) {
  try {
    return path.extname(decodeURIComponent(new URL(url, BASE).pathname));
  } catch {
    return '';
  }
}

function extFromDataUrl(dataUrl) {
  const mime = dataUrl.slice(5, dataUrl.indexOf(';')).toLowerCase();
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
    'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm', 'application/pdf': '.pdf',
    'audio/mpeg': '.mp3', 'audio/wav': '.wav' };
  return map[mime] || '';
}

async function writeDataUrl(target, dataUrl) {
  const comma = dataUrl.indexOf(',');
  const isBase64 = dataUrl.slice(0, comma).includes(';base64');
  const payload = dataUrl.slice(comma + 1);
  await fs.writeFile(target, isBase64 ? Buffer.from(payload, 'base64') : decodeURIComponent(payload));
}

async function download(task) {
  const result = await fetchToFile(task);
  // The server has lost some uploads. The site still holds a small inline
  // preview for most of them, which is better than nothing.
  if (result === 'failed' && task.fallback) {
    const ext = extFromDataUrl(task.fallback) || '.jpg';
    const stem = task.target.slice(0, task.target.length - path.extname(task.target).length);
    await writeDataUrl(`${stem} (low-res preview only)${ext}`, task.fallback);
    const failure = failures.find((f) => f.item === task.label);
    if (failure) failure.error += ' — saved the low-res preview instead';
    counts.previewsOnly += 1;
  }
  return result;
}

async function fetchToFile({ url, target, label }) {
  const full = new URL(url, BASE).href;
  try {
    const res = await fetch(full);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') || '';
    if (type.includes('text/html')) throw new Error('server returned a web page, not the file');
    const length = Number(res.headers.get('content-length') || 0);
    const existing = await fs.stat(target).catch(() => null);
    if (existing && length && existing.size === length) {
      await res.body?.cancel();
      return 'skipped';
    }
    const tmp = `${target}.part`;
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
    await fs.rename(tmp, target);
    return 'downloaded';
  } catch (err) {
    failures.push({ item: label, url: full, error: err.message });
    return 'failed';
  }
}

function webloc(href) {
  const escaped = href.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>URL</key>
  <string>${escaped}</string>
</dict>
</plist>
`;
}

function projectMarkdown(node) {
  const p = node.project || {};
  const lines = [`# ${p.title || node.name}`, ''];
  const meta = [['Category', p.category], ['Year', p.year], ['Role', p.role], ['Client', p.client]]
    .filter(([, v]) => v);
  for (const [k, v] of meta) lines.push(`**${k}:** ${v}  `);
  if (meta.length) lines.push('');
  if (p.description) lines.push(p.description, '');
  if (p.idea) lines.push('## Idea', '', p.idea, '');
  const execution = Array.isArray(p.execution) ? p.execution : p.execution ? [p.execution] : [];
  if (execution.length) lines.push('## Execution', '', ...execution.map((e) => `- ${typeof e === 'string' ? e : JSON.stringify(e)}`), '');
  if (p.result) lines.push('## Result', '', typeof p.result === 'string' ? p.result : '```json\n' + JSON.stringify(p.result, null, 2) + '\n```', '');
  if (p.tags?.length) lines.push(`**Tags:** ${p.tags.join(', ')}`, '');
  if (p.stack?.length) lines.push(`**Stack:** ${p.stack.join(', ')}`, '');
  if (p.links?.length) lines.push('## Links', '', ...p.links.map((l) => `- [${l.label}](${l.href})`), '');
  if (p.videoUrl) lines.push(`**Video:** ${p.videoUrl}`, '');
  return lines.join('\n');
}

// The JSON copy of the tree keeps every field except inline base64 blobs,
// which are already saved as real files.
function stripBlobs(value) {
  if (Array.isArray(value)) return value.map(stripBlobs);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripBlobs(v)]));
  }
  if (isData(value)) return `${value.slice(0, value.indexOf(','))},… (${Math.round(value.length / 1024)} KB inline, omitted)`;
  return value;
}

async function exportNode(node, dir, depth) {
  const pad = '  '.repeat(depth);
  const name = safeName(node.name);
  const kind = node.kind || 'file';

  if (kind === 'folder' || Array.isArray(node.children)) {
    const folderPath = claim(dir, name);
    await fs.mkdir(folderPath, { recursive: true });
    counts.folders += 1;
    indexLines.push(`${pad}- 📁 **${node.name}**${node.description ? ` — ${node.description}` : ''}`);
    for (const child of node.children || []) await exportNode(child, folderPath, depth + 1);
    return;
  }

  if (kind === 'text' || (typeof node.body === 'string' && !node.fileUrl && !node.file)) {
    const target = claim(dir, path.extname(name) ? name : `${name}.txt`);
    await fs.writeFile(target, node.body ?? '', 'utf8');
    counts.notes += 1;
    indexLines.push(`${pad}- 📝 ${node.name}`);
    return;
  }

  if (kind === 'project') {
    const target = claim(dir, withExt(name, '.md'));
    await fs.writeFile(target, projectMarkdown(node), 'utf8');
    counts.notes += 1;
    indexLines.push(`${pad}- 📄 ${node.name} (case study)`);
    return;
  }

  // Uploaded files: images, videos, PDFs, audio, anything else.
  const source = [node.fileUrl, node.file, node.dataUrl, node.href, node.src].find((v) => isSiteFile(v) || isData(v));
  if (source) {
    const ext = isData(source) ? extFromDataUrl(source) : extFromUrl(source);
    const target = claim(dir, withExt(name, ext));
    if (isData(source)) {
      await writeDataUrl(target, source);
    } else {
      const fallback = [node.dataUrl, node.preview, node.thumbnailUrl].find(isData);
      downloads.push({ url: source, target, fallback, label: `${path.relative(OUT, dir)}/${node.name}` });
    }
    counts.files += 1;
    indexLines.push(`${pad}- 📎 ${node.name}`);
    return;
  }

  // YouTube videos, Instagram reels and other web links.
  const href = [node.href, node.meta?.target, node.videoUrl, node.url].find(isWeb);
  if (href) {
    const target = claim(dir, withExt(name, '.webloc'));
    await fs.writeFile(target, webloc(href), 'utf8');
    if (!linksByFolder.has(dir)) linksByFolder.set(dir, []);
    linksByFolder.get(dir).push({ name: node.name, href, description: node.description });
    counts.links += 1;
    indexLines.push(`${pad}- 🔗 [${node.name}](${href})${node.description ? ` — ${node.description}` : ''}`);
    return;
  }

  // Anything left (e.g. the Email item) keeps its details as JSON.
  const target = claim(dir, withExt(name, '.json'));
  await fs.writeFile(target, JSON.stringify(stripBlobs(node), null, 2), 'utf8');
  counts.other += 1;
  indexLines.push(`${pad}- ⚙️ ${node.name} (${kind})`);
}

// Wallpapers and folder icons are referenced from settings, not the tree.
function collectSiteUrls(value, found = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => collectSiteUrls(v, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectSiteUrls(v, found));
  else if (typeof value === 'string' && value.startsWith('/uploads/')) found.add(value);
  return found;
}

async function runPool(tasks) {
  let next = 0;
  let done = 0;
  const tally = { downloaded: 0, skipped: 0, failed: 0 };
  const worker = async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      tally[await download(task)] += 1;
      done += 1;
      if (process.stdout.isTTY) process.stdout.write(`\r  ${done}/${tasks.length} files`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (tasks.length && process.stdout.isTTY) process.stdout.write('\n');
  return tally;
}

async function main() {
  console.log(`Reading ${BASE} …`);
  const [filesystem, master, settings, photos] = await Promise.all([
    getJson('/api/filesystem'),
    getJson('/api/master-sync').catch(() => null),
    getJson('/api/settings').catch(() => null),
    getJson('/api/photos').catch(() => null)
  ]);

  await fs.mkdir(SITE_DATA, { recursive: true });
  const save = (file, data) => data && fs.writeFile(path.join(SITE_DATA, file), JSON.stringify(data, null, 2), 'utf8');
  await Promise.all([
    save('filesystem.json', filesystem),
    save('master-snapshot.json', master),
    save('settings.json', settings),
    save('photos.json', photos)
  ]);

  const vite = await createServer({
    root: ROOT,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false }
  });
  let tree;
  try {
    const mod = await vite.ssrLoadModule('/src/data/ishantOS.js');
    mod.rebuildFSTree(filesystem.customNodes, filesystem.renames, filesystem.deleted, filesystem.edits);
    tree = mod.HOME;
  } finally {
    await vite.close();
  }

  await fs.writeFile(path.join(SITE_DATA, 'tree.json'), JSON.stringify(stripBlobs(tree), null, 2), 'utf8');

  for (const child of tree.children || []) await exportNode(child, OUT, 0);

  const assetDir = path.join(SITE_DATA, 'settings-assets');
  for (const url of collectSiteUrls([settings, photos, master?.masterSnapshot?.settings])) {
    await fs.mkdir(assetDir, { recursive: true });
    downloads.push({ url, target: claim(assetDir, safeName(path.basename(decodeURIComponent(url)))), label: `settings: ${url}` });
  }

  // Social links and the contact email live in site settings, not the tree.
  const social = Object.entries(settings?.socialLinks || {}).filter(([, href]) => isWeb(href));
  if (social.length || settings?.dashboardConfig?.contactEmail) {
    const rootLinks = linksByFolder.get(OUT) || [];
    for (const [label, href] of social) rootLinks.push({ name: label, href, description: 'Social link (site settings)' });
    if (settings?.dashboardConfig?.contactEmail) {
      rootLinks.push({ name: 'Contact email', href: `mailto:${settings.dashboardConfig.contactEmail}`, description: 'Site settings' });
    }
    linksByFolder.set(OUT, rootLinks);
  }

  for (const [dir, links] of linksByFolder) {
    const where = path.relative(OUT, dir) || 'top level';
    const body = [`Links in: ${where}`, '', ...links.flatMap((l) => [
      l.name,
      `  ${l.href}`,
      ...(l.description ? [`  ${l.description}`] : []),
      ''
    ])].join('\n');
    await fs.writeFile(path.join(dir, 'links.txt'), body, 'utf8');
  }

  console.log(`Downloading ${downloads.length} uploaded files …`);
  const tally = await runPool(downloads);

  const readme = [
    `# heyishant.com export`,
    '',
    `Exported ${new Date().toISOString()} from ${BASE}.`,
    `Live content last changed ${filesystem.updatedAt || 'unknown'}.`,
    '',
    `${counts.folders} folders · ${counts.notes} text files · ${counts.files} uploaded files · ${counts.links} links`,
    '',
    'Links (YouTube, Instagram, websites) are saved as `.webloc` files: double-click one to open it.',
    'Every folder that has links also has a `links.txt` listing them; the top-level one adds your social links.',
    '`_site-data/` holds the raw data from the server, for restoring or rebuilding the site.',
    '',
    '## Folder tree',
    '',
    ...indexLines,
    ''
  ];
  if (failures.length) {
    readme.push('## Files that could not be downloaded', '', ...failures.map((f) => `- ${f.item} — ${f.error} (${f.url})`), '');
  }
  await fs.writeFile(path.join(OUT, 'INDEX.md'), readme.join('\n'), 'utf8');

  console.log(`\nSaved to ${OUT}`);
  console.log(`  ${counts.folders} folders, ${counts.notes} text files, ${counts.files} uploaded files, ${counts.links} links, ${counts.other} other`);
  console.log(`  files: ${tally.downloaded} downloaded, ${tally.skipped} already there, ${tally.failed} failed (${counts.previewsOnly} saved as low-res previews)`);
  console.log(`  links.txt written in ${linksByFolder.size} folders`);
  for (const f of failures) console.log(`  ✗ ${f.item}: ${f.error}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
