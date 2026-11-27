'use client';

// The Writing tab: blog posts, written case studies and dream campaigns.
// Fields go into the post's --- block, the body is Markdown.

import { Marked } from 'marked';
import { useMemo, useRef, useState } from 'react';
import { POST_KINDS, type PostKind } from '@/content/writing';
import type { PostFields } from '@/server/post-format.mjs';
import { api, ApiError, parseYoutube, previewUrl, slugify, workThumb, type CmsState, type PostRow } from './api';
import { leave } from './DocEditors';
import { Fields, UploadButton, useCms, type FieldDef } from './fields';

type Draft = PostFields & { slug: string; body: string };

const today = () => new Date().toISOString().slice(0, 10);
const KIND_OPTIONS = (Object.keys(POST_KINDS) as PostKind[]).map((k) => ({ value: k, label: POST_KINDS[k].label }));

/** A rough preview: the real page adds the work player and YouTube embeds. */
function preview(state: CmsState, d: Draft) {
  const md = new Marked({ gfm: true, breaks: true });
  const src = (s: string) => {
    if (/^(https?:)?\/\//.test(s) || s.startsWith('data:')) return s;
    const path = s.startsWith('/') ? `public${s}` : `public/posts/${d.slug}/${s}`;
    return previewUrl(state, path);
  };
  md.use({
    renderer: {
      image({ href, text, title }) {
        return `<figure class="post-figure"><img src="${src(href)}" alt="${text.replace(/"/g, '&quot;')}">${title ? `<figcaption>${title}</figcaption>` : ''}</figure>`;
      },
    },
  });
  const body = d.body
    .replace(/^[ \t]*\[\[\s*work\s*:\s*([^\]]+)\]\][ \t]*$/gim, (_m, ids: string) => {
      const tiles = ids
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((id) => {
          const w = state.docs.works.data.find((x) => x.id === id);
          const t = w ? workThumb(state, w) : undefined;
          return `<span class="cms-pv-work">${t ? `<img src="${t}" alt="">` : ''}<small>${w ? w.title : `⚠ no work “${id}”`}</small></span>`;
        })
        .join('');
      return `\n<div class="cms-pv-works">${tiles}</div>\n`;
    })
    .replace(/^(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+)$/gim, (url) => {
      const yt = parseYoutube(url);
      return yt ? `\n<div class="cms-pv-yt"><img src="https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg" alt=""><span>▶ YouTube</span></div>\n` : url;
    });
  return md.parse(body, { async: false });
}

function BodyEditor({ draft, setBody }: { draft: Draft; setBody: (b: string) => void }) {
  const { state } = useCms();
  const area = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [workPick, setWorkPick] = useState(false);
  const insert = (text: string) => {
    const el = area.current;
    const at = el ? el.selectionStart : draft.body.length;
    const before = draft.body.slice(0, at);
    const after = draft.body.slice(el ? el.selectionEnd : at);
    const pad = (s: string) => (s && !s.endsWith('\n\n') ? (s.endsWith('\n') ? '\n' : '\n\n') : '');
    const block = `${pad(before)}${text}\n\n`;
    setBody(before + block + after.replace(/^\n+/, ''));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length + block.length, before.length + block.length);
    });
  };
  const html = useMemo(() => (view === 'preview' ? preview(state, draft) : ''), [view, state, draft]);

  return (
    <div className="cms-body-editor">
      <div className="cms-body-tools">
        <div className="cms-segment small">
          <label className={view === 'write' ? 'on' : undefined}>
            <input type="radio" checked={view === 'write'} onChange={() => setView('write')} />
            Write
          </label>
          <label className={view === 'preview' ? 'on' : undefined}>
            <input type="radio" checked={view === 'preview'} onChange={() => setView('preview')} />
            Preview
          </label>
        </div>
        {view === 'write' ? (
          <>
            <UploadButton
              purpose="post-image"
              accept="image/*"
              multiple
              label="+ Picture"
              extra={() => (draft.slug ? { slug: draft.slug } : null)}
              onDone={(r, file) => insert(`![${file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')}](${r.name} "")`)}
            />
            <button type="button" className="cms-btn ghost small" onClick={() => setWorkPick(!workPick)}>
              + Work
            </button>
            <button
              type="button"
              className="cms-btn ghost small"
              onClick={() => {
                const url = window.prompt('Paste the YouTube link');
                if (url && parseYoutube(url)) insert(url.trim());
              }}
            >
              + YouTube
            </button>
          </>
        ) : null}
      </div>
      {workPick && view === 'write' ? (
        <div className="cms-work-pick">
          <select
            autoFocus
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              insert(`[[work: ${e.target.value}]]`);
              setWorkPick(false);
            }}
          >
            <option value="">Choose a piece of work to show…</option>
            {state.docs.works.data.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
                {w.brand ? ` · ${w.brand}` : ''}
              </option>
            ))}
          </select>
          <small className="cms-muted">To show several side by side, write their ids together: [[work: id-one, id-two]]</small>
        </div>
      ) : null}
      {view === 'write' ? (
        <textarea ref={area} className="cms-body" rows={22} value={draft.body} onChange={(e) => setBody(e.target.value)} placeholder="Write the post here…" />
      ) : (
        <div className="cms-preview post-body" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      <details className="cms-help">
        <summary>How to format</summary>
        <ul>
          <li>
            <code>## Heading</code> for a section heading
          </li>
          <li>
            <code>**bold**</code> shows as a highlighter stroke, <code>*italics*</code>
          </li>
          <li>
            <code>[text](https://…)</code> for a link, <code>- item</code> for a list
          </li>
          <li>
            <code>&gt; a line</code> becomes a hand-written note in the margin
          </li>
          <li>
            <code>---</code> on its own line is a ✦ ✦ ✦ break
          </li>
          <li>Pictures on back-to-back lines become a little gallery. The text in quotes is the caption.</li>
        </ul>
      </details>
    </div>
  );
}

function PostForm({ row, isNew, onDone, onDirty }: { row?: PostRow; isNew: boolean; onDone: () => void; onDirty: (d: boolean) => void }) {
  const { state, refresh, toast } = useCms();
  const p = row?.post;
  const [draft, setDraft] = useState<Draft>(() => ({
    slug: p?.slug ?? '',
    kind: p?.kind ?? 'blog',
    title: p?.title ?? '',
    summary: p?.summary ?? '',
    date: p?.date ?? today(),
    brand: p?.brand,
    role: p?.role,
    cover: p?.cover,
    tags: p?.tags ?? [],
    results: p?.results ?? [],
    draft: p?.draft ?? false,
    body: (p?.body ?? '').replace(/^\n+/, ''),
  }));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saved, setSaved] = useState(!isNew);
  const [dirty, setDirtyState] = useState(false);
  const [busy, setBusy] = useState(false);
  const change = (patch: Partial<Draft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (!slugTouched && !saved && patch.title !== undefined) next.slug = slugify(patch.title);
      return next;
    });
    setDirtyState(true);
    onDirty(true);
  };
  const images = state.postImages[draft.slug] ?? [];

  const defs: FieldDef[] = [
    { key: 'title', label: 'Title', type: 'text', required: true, wide: true },
    { key: 'kind', label: 'Kind', type: 'select', required: true, options: KIND_OPTIONS },
    { key: 'date', label: 'Date', type: 'date', required: true, help: 'Newest shows first.' },
    { key: 'summary', label: 'Summary', type: 'textarea', rows: 2, required: true, help: 'One or two lines for the card, Google and link previews.' },
    { key: 'brand', label: draft.kind === 'dream-campaign' ? 'The brand it’s for' : 'Brand', type: 'text', required: draft.kind === 'dream-campaign', help: draft.kind === 'dream-campaign' ? 'The post says the brand didn’t ask for it.' : 'Optional.' },
    { key: 'role', label: 'Your role', type: 'text', help: 'Optional.' },
    { key: 'tags', label: 'Tags', type: 'tags' },
    {
      key: 'cover',
      label: 'Cover picture',
      type: 'custom',
      render: (v, set) => (
        <div className="cms-cover">
          {v ? <img src={/\.[a-z0-9]{2,5}$/i.test(v) ? previewUrl(state, v.startsWith('/') ? `public${v}` : `public/posts/${draft.slug}/${v}`) : (state.media.images[v] ? previewUrl(state, `public/img/photo/${v}-640.webp`) : undefined)} alt="" /> : <span className="cms-photo-empty">No cover</span>}
          <div className="cms-row">
            <UploadButton purpose="post-image" accept="image/*" label="Upload cover" extra={() => (draft.slug ? { slug: draft.slug } : null)} onDone={(r) => set(String(r.name))} />
            {images.length ? (
              <select aria-label="Or use a picture from this post" value={images.includes(v) ? v : ''} onChange={(e) => set(e.target.value || undefined)}>
                <option value="">or one of this post’s pictures…</option>
                {images.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            ) : null}
            {v ? (
              <button type="button" className="cms-btn ghost small" onClick={() => set(undefined)}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'results',
      label: 'Results',
      type: 'repeat',
      help: 'Shown as big stickers above the post.',
      fields: [
        { key: 'value', label: 'Number', type: 'text', required: true, placeholder: '2.1M' },
        { key: 'label', label: 'What it means', type: 'text', required: true, placeholder: 'views in a month' },
      ],
      itemLabel: (r) => [r.value, r.label].filter(Boolean).join(' · '),
      newItem: () => ({ value: '', label: '' }),
    },
    { key: 'draft', label: 'Draft', type: 'check', help: 'Only on the preview site until you untick this and publish.' },
  ];

  const submit = async () => {
    if (!draft.slug) return toast('Give the post a title first.', 'error');
    setBusy(true);
    try {
      const { slug, ...fields } = draft;
      await api('PUT', '/post', { slug, fields, base: row?.base ?? null, isNew: !saved });
      await refresh();
      setSaved(true);
      setDirtyState(false);
      onDirty(false);
      toast('Saved. Publish when you’re ready.');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : String(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cms-editor">
      <div className="cms-editor-head">
        <button type="button" className="cms-link" onClick={() => leave(dirty) && (onDirty(false), onDone())}>
          ← all posts
        </button>
        <h2>{draft.title || 'New post'}</h2>
      </div>
      <div className="cms-fields">
        <div className="cms-field wide">
          <span className="cms-label">
            <label htmlFor="p-slug">Link</label>
            <small>{saved ? 'Fixed once saved, so links to it keep working.' : 'Made from the title. Lowercase letters, numbers and dashes.'}</small>
          </span>
          <div className="cms-slug">
            <span>heyishant.com/writing/</span>
            <input
              id="p-slug"
              value={draft.slug}
              disabled={saved}
              onChange={(e) => {
                setSlugTouched(true);
                change({ slug: slugify(e.target.value) });
              }}
            />
          </div>
        </div>
      </div>
      <Fields defs={defs} value={draft as unknown as Record<string, unknown>} onChange={(v) => change(v as Partial<Draft>)} />
      <div className="cms-field wide">
        <span className="cms-label">
          <label>
            The post <b aria-hidden="true">*</b>
          </label>
          {!draft.slug ? <small>Add a title first, then you can add pictures.</small> : null}
        </span>
        <BodyEditor draft={draft} setBody={(body) => change({ body })} />
      </div>
      <div className="cms-form-actions sticky">
        <button type="button" className="cms-btn" disabled={busy || (!dirty && saved)} onClick={submit}>
          {busy ? 'Saving…' : saved && !dirty ? 'Saved' : 'Save'}
        </button>
        <button type="button" className="cms-btn ghost" onClick={() => leave(dirty) && (onDirty(false), onDone())}>
          {saved && !dirty ? 'Back' : 'Cancel'}
        </button>
        {saved ? (
          <a className="cms-btn ghost" href={`/writing/${draft.slug}`} target="_blank" rel="noopener">
            Live page ↗
          </a>
        ) : null}
        {saved ? (
          <button
            type="button"
            className="cms-btn danger"
            onClick={async () => {
              if (!window.confirm(`Delete “${draft.title}”? It disappears from the site when you publish.`)) return;
              await api('DELETE', `/post/${draft.slug}`, { base: row?.base ?? null });
              await refresh();
              onDirty(false);
              onDone();
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PostEditor({ onDirty }: { onDirty: (d: boolean) => void }) {
  const { state } = useCms();
  const [editing, setEditing] = useState<{ slug: string | null } | null>(null);
  const rows = [...state.posts].sort((a, b) => (b.post?.date ?? '').localeCompare(a.post?.date ?? ''));

  if (editing) {
    const row = editing.slug ? state.posts.find((r) => r.slug === editing.slug) : undefined;
    return <PostForm key={editing.slug ?? 'new'} row={row} isNew={!row} onDone={() => setEditing(null)} onDirty={onDirty} />;
  }

  return (
    <div>
      <p className="cms-intro">Posts on /writing: blog posts, written case studies and dream campaigns. Drafts show only on the preview site.</p>
      <div className="cms-toolbar">
        <button type="button" className="cms-btn" onClick={() => setEditing({ slug: null })}>
          + New post
        </button>
      </div>
      <ol className="cms-list">
        {rows.map((r) => (
          <li key={r.slug}>
            <button type="button" className="cms-list-main" onClick={() => r.post && setEditing({ slug: r.slug })} disabled={!r.post}>
              <span className={`cms-kind k-${r.post?.kind ?? 'x'}`}>{r.post ? POST_KINDS[r.post.kind].label : '⚠'}</span>
              <span>
                <b>{r.post?.title ?? r.slug}</b>
                <small>
                  {r.post ? `${r.post.date} · /writing/${r.slug}` : r.error}
                  {r.post?.draft ? <em className="cms-badge">draft</em> : null}
                  {r.pending ? <em className="cms-badge pending">unpublished</em> : null}
                </small>
              </span>
            </button>
          </li>
        ))}
        {rows.length === 0 ? <li className="cms-muted">No posts yet.</li> : null}
      </ol>
    </div>
  );
}
