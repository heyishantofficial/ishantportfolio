// `next build` copies public/ into out/. Locally public/media is a symlink to the
// encoded videos (for `next dev`), so drop that copy: the server serves /media
// from the volume instead.
import fs from 'node:fs';
fs.rmSync(new URL('../out/media', import.meta.url), { recursive: true, force: true });

// With no published posts, app/writing/[slug] builds a placeholder page (a static
// export needs at least one). Remove it so /writing/_none is a real 404.
for (const f of ['_none.html', '_none.txt', '_none']) {
  fs.rmSync(new URL(`../out/writing/${f}`, import.meta.url), { recursive: true, force: true });
}
