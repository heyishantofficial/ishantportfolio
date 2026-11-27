// `next build` copies public/ into out/. Locally public/media is a symlink to the
// encoded videos (for `next dev`), so drop that copy: the server serves /media
// from the volume instead.
import fs from 'node:fs';
fs.rmSync(new URL('../out/media', import.meta.url), { recursive: true, force: true });
