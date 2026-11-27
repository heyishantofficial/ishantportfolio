'use client';

// The Work tab: every piece on /work, in order, plus adding new pieces with
// their video, photo, YouTube link or website.

import { useMemo, useState } from 'react';
import { CATEGORIES, type Work } from '@/content/works';
import { api, freshId, parseYoutube, posterPreview, videoPreview, waitForJob, workThumb, ytPreview } from './api';
import { leave } from './DocEditors';
import { UploadButton, useCms } from './fields';

const KINDS: { value: Work['kind']; label: string; help: string }[] = [
  { value: 'video', label: 'Video file', help: 'Upload a video. It plays on the site, with a short preview on hover.' },
  { value: 'image', label: 'Photo', help: 'Upload a photo.' },
  { value: 'youtube', label: 'YouTube', help: 'Paste a YouTube link.' },
  { value: 'link', label: 'Website', help: 'A link to somewhere else.' },
];
const KIND_LABEL: Record<Work['kind'], string> = { video: '▶ video', image: '◼ photo', youtube: '▶ youtube', link: '↗ link' };

const clean = (w: Work): Work => {
  // Same key order as the rest of works.json, so diffs stay small.
  const out: Work = { id: w.id, title: w.title.trim(), ...(w.brand?.trim() ? { brand: w.brand.trim() } : {}), category: w.category, kind: w.kind };
  if (w.kind === 'youtube') {
    out.youtubeId = w.youtubeId;
    if (w.short) out.short = true;
  }
  if (w.href?.trim()) out.href = w.href.trim();
  if (w.caseSlug) out.caseSlug = w.caseSlug;
  return out;
};

function WorkForm({ initial, isNew, works, onDone, onDirty }: { initial: Work; isNew: boolean; works: Work[]; onDone: () => void; onDirty: (d: boolean) => void }) {
  const { state, save, refresh, toast } = useCms();
  const [w, setW] = useState<Work>(initial);
  const [ytText, setYtText] = useState(initial.youtubeId ? `https://www.youtube.com/${initial.short ? 'shorts/' : 'watch?v='}${initial.youtubeId}` : '');
  const [dirty, setDirtyState] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<Work>) => {
    setW((x) => ({ ...x, ...patch }));
    setDirtyState(true);
    onDirty(true);
  };
  const taken = (id: string) => works.some((x) => x.id === id && x !== initial) || Boolean(state.media.videos[id] || state.media.images[id]);
  /** New pieces get their id when the first file is chosen, from the title. */
  const ensureId = () => {
    if (w.id) return w.id;
    const id = freshId(w.title || 'work', taken, 'work');
    setW((x) => ({ ...x, id }));
    return id;
  };

  const hasMedia = w.kind === 'video' ? Boolean(w.id && state.media.videos[w.id]) : w.kind === 'image' ? Boolean(w.id && state.media.images[w.id]) : w.kind === 'youtube' ? Boolean(w.youtubeId) : Boolean(w.href?.startsWith('http'));
  const problems = [!w.title.trim() && 'Give it a title.', !hasMedia && { video: 'Upload the video.', image: 'Upload the photo.', youtube: 'Paste a YouTube link.', link: 'Add the website link.' }[w.kind]].filter(Boolean) as string[];

  const submit = async () => {
    if (problems.length) return toast(problems.join(' '), 'error');
    setSaving(true);
    try {
      const final = clean({ ...w, id: w.id || freshId(w.title, taken, 'work') });
      // A YouTube video's thumbnail is fetched once, so the site doesn't load it from YouTube.
      if (final.kind === 'youtube' && final.youtubeId && !state.media.youtube[final.youtubeId]) {
        const { job } = await api<{ job: string }>('POST', '/youtube', { youtubeId: final.youtubeId, short: Boolean(final.short) });
        await waitForJob(job).catch(() => undefined);
      }
      const next = isNew ? [final, ...works] : works.map((x) => (x.id === initial.id ? final : x));
      if (await save('works', next, `${isNew ? 'Add' : 'Edit'} work “${final.title}”`)) {
        onDirty(false);
        onDone();
      }
    } finally {
      setSaving(false);
      await refresh();
    }
  };

  const poster = w.id ? posterPreview(state, w.id) : undefined;
  const video = w.id ? videoPreview(state, w.id) : undefined;
  const photo = w.id && state.media.images[w.id] ? workThumb(state, { ...w, kind: 'image' }) : undefined;

  return (
    <div className="cms-editor">
      <div className="cms-editor-head">
        <button type="button" className="cms-link" onClick={() => leave(dirty) && (onDirty(false), onDone())}>
          ← all work
        </button>
        <h2>{isNew ? 'New piece of work' : w.title}</h2>
        {w.id ? <small className="cms-muted">id: {w.id}</small> : null}
      </div>

      <div className="cms-fields">
        <div className="cms-field wide">
          <span className="cms-label">
            <label htmlFor="w-title">
              Title <b aria-hidden="true">*</b>
            </label>
          </span>
          <input id="w-title" value={w.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="cms-field">
          <span className="cms-label">
            <label htmlFor="w-brand">Brand</label>
          </span>
          <input id="w-brand" value={w.brand ?? ''} list="cms-brands" onChange={(e) => set({ brand: e.target.value })} />
          <datalist id="cms-brands">
            {[...new Set(works.map((x) => x.brand).filter(Boolean))].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
        <div className="cms-field">
          <span className="cms-label">
            <label htmlFor="w-cat">
              Category <b aria-hidden="true">*</b>
            </label>
            <small>Which filter it sits under on /work.</small>
          </span>
          <select id="w-cat" value={w.category} onChange={(e) => set({ category: e.target.value as Work['category'] })}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="cms-field wide cms-kinds">
          <legend className="cms-label">What is it?</legend>
          <div className="cms-segment">
            {KINDS.map((k) => (
              <label key={k.value} className={w.kind === k.value ? 'on' : undefined}>
                <input type="radio" name="w-kind" value={k.value} checked={w.kind === k.value} onChange={() => set({ kind: k.value })} />
                {k.label}
              </label>
            ))}
          </div>
          <small className="cms-muted">{KINDS.find((k) => k.value === w.kind)?.help}</small>
        </fieldset>

        {w.kind === 'video' ? (
          <div className="cms-field wide">
            <div className="cms-media-box">
              {video ? <video src={video} poster={poster} controls playsInline preload="none" /> : <span className="cms-photo-empty">No video yet</span>}
              <div>
                <UploadButton
                  purpose="video"
                  accept="video/*"
                  label={video ? 'Replace the video' : 'Upload the video'}
                  className="cms-btn"
                  extra={() => ({ id: ensureId() })}
                  onDone={() => {
                    setDirtyState(true);
                    onDirty(true);
                  }}
                />
                <small className="cms-muted">MP4 or MOV, up to 2 GB. It’s made web-sized on the server (720p), which takes about as long as the video.</small>
              </div>
            </div>
          </div>
        ) : null}

        {w.kind === 'image' ? (
          <div className="cms-field wide">
            <div className="cms-media-box">
              {photo ? <img src={photo} alt="" /> : <span className="cms-photo-empty">No photo yet</span>}
              <div>
                <UploadButton
                  purpose="image"
                  accept="image/*"
                  label={photo ? 'Replace the photo' : 'Upload the photo'}
                  className="cms-btn"
                  extra={() => ({ id: ensureId() })}
                  onDone={() => {
                    setDirtyState(true);
                    onDirty(true);
                  }}
                />
                <small className="cms-muted">JPG, PNG, WebP or HEIC. It’s resized and turned upright automatically.</small>
              </div>
            </div>
          </div>
        ) : null}

        {w.kind === 'youtube' ? (
          <div className="cms-field wide">
            <span className="cms-label">
              <label htmlFor="w-yt">
                YouTube link <b aria-hidden="true">*</b>
              </label>
              <small>A normal video or a Short. Shorts show tall.</small>
            </span>
            <input
              id="w-yt"
              value={ytText}
              placeholder="https://www.youtube.com/watch?v=…"
              onChange={(e) => {
                setYtText(e.target.value);
                const yt = parseYoutube(e.target.value);
                set({ youtubeId: yt?.id, short: yt ? yt.short || (yt.id === w.youtubeId && w.short) : undefined });
              }}
            />
            <label className="cms-check">
              <input type="checkbox" checked={Boolean(w.short)} onChange={(e) => set({ short: e.target.checked })} />
              <span>It’s vertical (a Short)</span>
            </label>
            {w.youtubeId ? <img className={`cms-yt-thumb${w.short ? ' tall' : ''}`} src={ytPreview(state, w.youtubeId)} alt="" /> : null}
          </div>
        ) : null}

        <div className="cms-field wide">
          <span className="cms-label">
            <label htmlFor="w-href">{w.kind === 'link' ? 'Website link *' : 'Original post (optional)'}</label>
            <small>{w.kind === 'link' ? 'Where the tile goes.' : 'Like the Instagram post. Shown as “view original” in the player.'}</small>
          </span>
          <input id="w-href" type="url" value={w.href ?? ''} placeholder="https://" onChange={(e) => set({ href: e.target.value })} />
        </div>

        <div className="cms-field wide">
          <span className="cms-label">
            <label htmlFor="w-case">Part of a case study</label>
            <small>Shows it under “what we made” on that case’s page.</small>
          </span>
          <select id="w-case" value={w.caseSlug ?? ''} onChange={(e) => set({ caseSlug: e.target.value || undefined })}>
            <option value="">No</option>
            {state.docs.cases.data.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title} · {c.brand}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="cms-form-actions">
        <button type="button" className="cms-btn" disabled={saving} onClick={submit}>
          {saving ? 'Saving…' : isNew ? 'Add to the site' : 'Save'}
        </button>
        <button type="button" className="cms-btn ghost" onClick={() => leave(dirty) && (onDirty(false), onDone())}>
          Cancel
        </button>
        {!isNew ? (
          <button
            type="button"
            className="cms-btn danger"
            onClick={async () => {
              if (!window.confirm(`Delete “${initial.title}”? It disappears from the site when you publish. Posts that show it with [[work: ${initial.id}]] would stop publishing, so remove it from them first.`)) return;
              if (
                await save(
                  'works',
                  works.filter((x) => x.id !== initial.id),
                  `Delete work “${initial.title}”`,
                )
              ) {
                onDirty(false);
                onDone();
              }
            }}
          >
            Delete
          </button>
        ) : null}
        {problems.length && dirty ? <small className="cms-muted">{problems.join(' ')}</small> : null}
      </div>
    </div>
  );
}

export function WorkEditor({ onDirty }: { onDirty: (d: boolean) => void }) {
  const { state, save } = useCms();
  const works = state.docs.works.data;
  const [editing, setEditing] = useState<{ work: Work; isNew: boolean } | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return works.map((w, i) => ({ w, i })).filter(({ w }) => (!cat || w.category === cat) && (!needle || `${w.title} ${w.brand ?? ''} ${w.id}`.toLowerCase().includes(needle)));
  }, [works, q, cat]);
  const filtered = Boolean(q.trim() || cat);

  if (editing) return <WorkForm key={editing.work.id || 'new'} initial={editing.work} isNew={editing.isNew} works={works} onDone={() => setEditing(null)} onDirty={onDirty} />;

  const move = (i: number, to: number) => {
    if (to < 0 || to >= works.length || to === i) return;
    const next = [...works];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    void save('works', next, 'Reorder work');
  };

  return (
    <div>
      <p className="cms-intro">Everything on /work, in the order it shows. New pieces go to the top. A piece joins a case study from its own page.</p>
      <div className="cms-toolbar">
        <button type="button" className="cms-btn" onClick={() => setEditing({ work: { id: '', title: '', category: 'campaigns', kind: 'video' }, isNew: true })}>
          + Add work
        </button>
        <input className="cms-search" type="search" placeholder={`Search ${works.length} pieces…`} value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {filtered ? <p className="cms-muted">Clear the search to reorder.</p> : null}
      <ol className="cms-list">
        {shown.map(({ w, i }) => {
          const thumb = workThumb(state, w);
          const missing = (w.kind === 'video' && !state.media.videos[w.id]) || (w.kind === 'image' && !state.media.images[w.id]);
          const kase = w.caseSlug ? state.docs.cases.data.find((c) => c.slug === w.caseSlug) : undefined;
          return (
            <li key={w.id}>
              <button type="button" className="cms-list-main" onClick={() => setEditing({ work: { ...w }, isNew: false })}>
                {thumb ? <img src={thumb} alt="" loading="lazy" onError={(e) => e.currentTarget.classList.add('broken')} /> : <span className="cms-thumb-empty" aria-hidden="true" />}
                <span>
                  <b>{w.title}</b>
                  <small>
                    {[w.brand, CATEGORIES.find((c) => c.id === w.category)?.label, KIND_LABEL[w.kind], kase ? `in “${kase.title}”` : null].filter(Boolean).join(' · ')}
                    {missing ? <em className="cms-warn"> · no file yet</em> : null}
                  </small>
                </span>
              </button>
              {!filtered ? (
                <div className="cms-mini-actions">
                  <button type="button" onClick={() => move(i, 0)} disabled={i === 0} aria-label={`Move ${w.title} to the top`} title="To the top">
                    ⤒
                  </button>
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${w.title} up`}>
                    ↑
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === works.length - 1} aria-label={`Move ${w.title} down`}>
                    ↓
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
