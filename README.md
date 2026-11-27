# heyishant.com

Ishant Chauhan's portfolio. A notebook-style site: Home, Work (every piece, filterable, with a
video lightbox), four case studies, Writing (blog posts, written case studies and dream campaigns),
the Journey (five episodes), a drag-around Playground and Contact. Everything on it can be edited at
**heyishant.com/admin** (see [The CMS](#the-cms-admin)).

The old "desktop OS" site is kept at the git tag `v1-live`.

## How it fits together

- **Next.js 16, static export.** `npm run build` writes plain HTML, CSS and JS to `out/`. No server-side rendering.
- **A small Express server** (`server/index.js`) serves `out/` plus the video files. Video lives on the
  server's volume, not in git.
- **Content lives in git.** Text, works, case studies and the Journey are JSON in `content/data/`, posts are
  Markdown in `content/posts/`. Edit them in the CMS at `/admin` (it commits to GitHub for you) or by hand.
- **Motion is CSS** (keyframes and scroll-driven animations), so there's no animation library. Everything
  turns off for people who ask their system for reduced motion.

```
app/(site)/          public pages (home, work, writing, journey, playground, contact)
app/admin/           the CMS page (/admin)
components/          Nav, Footer, WorkGrid + Lightbox, CaseCard, PlaygroundMat, small UI pieces
components/admin/    the CMS's editors
content/
  data/site.json     name, tagline, about text, skills, brands, socials, side projects
  data/works.json    every piece of work, in order, with category and case-study link
  data/cases.json    the featured case studies (brief, idea, results, BTS)
  data/episodes.json the Journey text, roles and camera roll
  site.ts, works.ts, cases.ts, episodes.ts   the types for those files
  writing.ts         the Writing page's words and the three kinds of post
  posts/             one Markdown file per post on the Writing page
  media.json         sizes, durations and cache keys of every video and photo
lib/                 media URLs, Markdown posts, analytics, draft flag
public/img/          posters, photos and YouTube thumbnails (generated, committed)
public/posts/        images used in posts, one folder per post
public/resume.pdf    the resume behind every "Resume" button
scripts/             media encoder, media upload, CMS password, old-site export
server/index.js      production server
server/cms.mjs       the CMS's API: login, edits, uploads, publishing to GitHub
server/media-encode.mjs  video and photo encoding (used by the CMS and scripts/encode-media.mjs)
server/post-format.mjs   reads, checks and writes Writing posts (used by the CMS and the build)
data/media/          encoded videos and PDFs (generated, NOT in git, uploaded to the server)
```

## Run it locally

Needs Node 22 and, for encoding, `ffmpeg`, `ffprobe` and `cwebp` (`brew install ffmpeg webp`).

```bash
npm install
npm run dev            # http://localhost:3000, with the "needs from you" draft notes
```

Videos play locally only after `data/media/` has been filled by the encoder (`public/media` links to it).

To try the production build exactly as the server runs it:

```bash
npm run build && npm start     # http://localhost:3000
```

Checks: `npm run typecheck` and `npm run lint`.

## Draft notes

With `NEXT_PUBLIC_DRAFT=1` the site shows dashed orange "this still needs…" notes wherever content
is missing (results, briefs, photos), and "?.?" result stickers. The same flag also tells search engines
not to index the site.

- `npm run dev` has it on (`.env.development`).
- A normal `npm run build` has it off, so the live site never shows the notes.
- The preview deployment turns it on with a build argument (see below).

## Adding or changing work

The easy way is `/admin` → Work → **Add work**: upload the video or photo (or paste a YouTube link) and
publish. To do it by hand:

1. Put the original file in the source folder (by default `../heyishant-live-export`).
2. Add `"your-id": "path/inside/that/folder.mp4"` to `scripts/media-sources.json`.
   YouTube videos don't need this step: they only need a `youtubeId`.
3. Add a row to `content/data/works.json`, with the same `id`, a title, brand, category and kind.
   Set `caseSlug` to show it in a case study.
4. Encode, then check it with `npm run dev`:
   ```bash
   npm run media:encode -- --only your-id
   ```
   Videos become 720p H.264 (the original is kept when it's already smaller), plus a 5-second preview
   loop and a poster. Photos become WebP at 640 and 1280 px.
5. Commit (`content/`, `public/img/`) and upload the video files to the server:
   ```bash
   npm run media:push -- https://heyishant.com
   ```
   This only sends files the server doesn't have yet, or that changed.

### The media key

`media:push` proves it's you with the key in `.media-key`. It's a private file on this computer that
git ignores, so keep a copy in your password manager. The server only knows its SHA-256, in
`server/media-key.sha256`, which is safe to have in this public repo.

- On a new computer, put the key back in `.media-key`.
- If the key is lost or leaked, run `npm run media:key -- --new`, commit `server/media-key.sha256` and deploy.

There's no password option for `media:push` on purpose: the old site's password is in this public repo's
history. If Dokploy still has an `ADMIN_PASSWORD` env var from the old site, delete it, as nothing uses it.
(The CMS's optional password is different: only its hash is stored, and only in Dokploy.)

Case-study text (brief, idea, results, behind-the-scenes photos) is in `content/data/cases.json`.
Journey text is in `content/data/episodes.json`.

## Posting on Writing

`/writing` lists blog posts, written case studies and dream campaigns (ideas for brands that haven't
asked for them). Each post is one Markdown file, `content/posts/<link-name>.md`, and the file name
becomes its link: `swiggy-midnight.md` is `/writing/swiggy-midnight`. Use lowercase letters, numbers
and dashes.

The easy way is `/admin` → Writing → **New post**, which also uploads pictures for you. By hand:
the three files already there are drafts that show every feature. Copy one to start.

```markdown
---
title: Midnight cravings, but make it a campaign
kind: dream campaign          # blog, case study or dream campaign
date: 2026-12-01              # YYYY-MM-DD, newest shows first
summary: One or two lines for the card, Google and link previews.
brand: Swiggy                 # needed for a dream campaign; optional otherwise
role: Concept and script      # optional
cover: cover.jpg              # optional: a file, a work id, or a photo id
tags: [food, late night]      # optional
results:                      # optional, shown as stickers
  - 2.1M | views in a month
draft: true                   # optional: preview site only until you delete this line
---

The post, in Markdown.
```

In the post:

- `## Heading`, `**bold**` (a highlighter stroke), `*italics*`, `[a link](https://...)`, lists with `-`.
- `> a line` becomes a hand-written margin note. `---` is a ✦ ✦ ✦ break.
- Images go in `public/posts/<link-name>/`. Write `![what's in it](photo.jpg "caption")`. One image
  on its own line is a taped photo; several on back-to-back lines make a gallery. Export them around
  1600 px wide, JPG or WebP, so pages stay fast.
- A YouTube link on its own line plays in the post.
- `[[work: id, id]]` on its own line shows those pieces from `content/works.ts`, with the video player.

Check it with `npm run dev` (drafts show there), then commit and deploy. A typo in the `---` block or
a missing image stops the build with a message naming the file, so a broken post can't go live.
Published posts also go into `/writing/feed.xml` (RSS) and the sitemap.

## The CMS (/admin)

`heyishant.com/admin` edits everything: Work (add, reorder, upload videos and photos), Writing,
Case studies, the Journey and the site's text, plus the resume PDF.

**How it works.** Git stays the source of truth. The CMS reads the content straight from GitHub,
keeps your edits on the server as *unpublished changes*, and **Publish** turns them all into one commit
on `main`. Dokploy sees the push and rebuilds the site (about 3 minutes); the admin page shows when the
new version is live. Every publish is a normal commit, so it has history and can be reverted.

- Videos are encoded on the server (720p, with a preview loop and a poster) and go onto the volume when
  you publish. Photos are resized, turned upright and committed. Uploads go in 8 MB pieces, so a slow
  connection or a proxy timeout doesn't lose a big video.
- Before committing it checks what would break the build or a page (a video work without a video, a
  post using a picture that isn't uploaded, a `[[work: …]]` that doesn't exist) and says what to fix.
- If someone changed the same file on GitHub after you started editing, it stops and asks before
  replacing their version. Changes to other files are kept.

**Logging in**: with the media key (from your password manager), or with a password if you set one:
run `npm run cms:password`, and put the line it prints into Dokploy as `CMS_PASSWORD_HASH`. Only that
hash is stored, never the password, and it is never in the repo. Sessions last 14 days.

**One-time setup in Dokploy** (the live app):

1. Create a GitHub token that can only write this repo: GitHub → Settings → Developer settings →
   Fine-grained tokens → *Generate new token*. Repository access: *Only select repositories* →
   `ishantportfolio`. Permissions: *Contents: Read and write* (nothing else). Pick an expiry and put a
   reminder in your calendar.
2. In Dokploy, add the environment variable `CMS_GITHUB_TOKEN` with that token, plus
   `CMS_PASSWORD_HASH` if you made one. Redeploy.
3. Open `heyishant.com/admin` and log in.

Optional: `CMS_GITHUB_BRANCH` (default `main`) and `CMS_GITHUB_REPO` (default
`heyishantofficial/ishantportfolio`) if either ever changes. A preview app must never point the CMS at
`main` unless you want it to publish to the live site.

**If you also edit on this computer**, run `git pull` before you start, because the CMS commits to `main`
directly. If both touched the same file, git shows a normal merge conflict.

**Trying it locally**: `npm run build && npm run cms:local` serves the site with the CMS on
http://localhost:3000/admin, reading and writing this folder's files instead of GitHub (nothing is
committed; review with `git diff`). It needs `ffmpeg` and `cwebp` for uploads.

## Deploying (Dokploy)

The `Dockerfile` builds the site and runs `node server/index.js` on port 3000.

| Setting | Value |
|---|---|
| Volume | mount at `/app/data` (videos go in `/app/data/media`, old `/uploads` links keep working) |
| Build arg `NEXT_PUBLIC_DRAFT` | `1` for the preview site (draft notes, no indexing), unset for the live site |
| Env `CMS_GITHUB_TOKEN` | a fine-grained GitHub token with *Contents: read and write* on this repo; turns on publishing from `/admin` |
| Env `CMS_PASSWORD_HASH` | optional, from `npm run cms:password`: log in to `/admin` with a password as well as the media key |
| Health check | `GET /health` (also reports how many videos are on the volume) |

**A preview** (optional): create a second Dokploy app from a branch at `new.heyishant.com`, with its own
volume and build arg `NEXT_PUBLIC_DRAFT=1`. After the first deploy run
`npm run media:push -- https://new.heyishant.com`.

**Going live** is pushing to `main`: the live app rebuilds. If videos were added, run
`npm run media:push -- https://heyishant.com` afterwards.

**Rolling back** is pointing the live app at the `v1-live` tag again, or reverting the merge. The new
server only ever writes to `/app/data/media`, so the old site's data on the volume (`filesystem.json`,
`uploads/`, snapshots) is still there.

## The old site

`v1-live` is the last version of the desktop-OS site. `scripts/export-live-site.mjs` downloads everything
uploaded to it (folders, files, links, Journey text), but it needs the old code, so run it from a checkout
of that tag:

```bash
git worktree add ../v1 v1-live && cd ../v1 && npm ci
node scripts/export-live-site.mjs https://heyishant.com ../heyishant-live-export
```
