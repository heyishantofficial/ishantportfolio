'use client';

// Editors for the JSON documents: case studies, the Journey and the site's text.

import { useState, type ReactNode } from 'react';
import type { CaseStudy } from '@/content/cases';
import type { Episode } from '@/content/episodes';
import type { SiteContent } from '@/content/site';
import { freshId, parseYoutube, posterPreview, previewUrl, ytPreview, type CmsState, type DocKey } from './api';
import { Fields, UploadButton, useCms, type FieldDef } from './fields';

/* oxlint-disable typescript/no-explicit-any */
type Obj = Record<string, any>;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const STICKER_COLORS = ['yellow', 'mint', 'pink', 'sky', 'sand', 'blush', 'blue', 'green', 'orange'].map((c) => ({ value: c, label: c }));

/** Confirms before throwing away edits. */
export const leave = (dirty: boolean) => !dirty || window.confirm('Leave without saving these edits?');

// ---------- a list of items: pick one, edit it, save ----------

function ListDoc<T extends Obj>({
  docKey,
  items,
  idKey,
  noun,
  defs,
  row,
  newItem,
  makeId,
  intro,
  onDirty,
}: {
  docKey: DocKey;
  items: T[];
  idKey: string;
  noun: string;
  defs: FieldDef[];
  row: (item: T) => { title: string; sub?: string; thumb?: string };
  newItem: () => T;
  makeId: (item: T, taken: (id: string) => boolean) => string;
  intro?: ReactNode;
  onDirty: (d: boolean) => void;
}) {
  const { save } = useCms();
  const [editing, setEditing] = useState<{ index: number; draft: T; isNew: boolean } | null>(null);
  const [dirty, setDirtyState] = useState(false);
  const setDirty = (d: boolean) => {
    setDirtyState(d);
    onDirty(d);
  };

  const persist = async (next: T[], note: string) => {
    const ok = await save(docKey, next as any, note);
    if (ok) {
      setEditing(null);
      setDirty(false);
    }
    return ok;
  };

  if (editing) {
    const { draft, isNew, index } = editing;
    const label = row(draft).title || `New ${noun}`;
    return (
      <div className="cms-editor">
        <div className="cms-editor-head">
          <button type="button" className="cms-link" onClick={() => leave(dirty) && (setEditing(null), setDirty(false))}>
            ← all {noun === 'case study' ? 'case studies' : `${noun}s`}
          </button>
          <h2>{label}</h2>
          {!isNew ? <small className="cms-muted">link id: {draft[idKey]}</small> : null}
        </div>
        <Fields
          defs={defs}
          value={draft}
          onChange={(v) => {
            setEditing({ ...editing, draft: v as T });
            setDirty(true);
          }}
        />
        <div className="cms-form-actions">
          <button
            type="button"
            className="cms-btn"
            onClick={async () => {
              const d = clone(draft);
              if (isNew) (d as Obj)[idKey] = makeId(d, (id) => items.some((x) => x[idKey] === id));
              const next = isNew ? [...items, d] : items.map((x, i) => (i === index ? d : x));
              await persist(next, `${isNew ? 'Add' : 'Edit'} ${noun} “${row(d).title}”`);
            }}
          >
            Save
          </button>
          <button type="button" className="cms-btn ghost" onClick={() => leave(dirty) && (setEditing(null), setDirty(false))}>
            Cancel
          </button>
          {!isNew ? (
            <button
              type="button"
              className="cms-btn danger"
              onClick={async () => {
                if (!window.confirm(`Delete “${label}”? It disappears from the site when you publish.`)) return;
                await persist(
                  items.filter((_, i) => i !== index),
                  `Delete ${noun} “${label}”`,
                );
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    void persist(next, `Reorder ${noun === 'case study' ? 'case studies' : `${noun}s`}`);
  };

  return (
    <div>
      {intro}
      <div className="cms-toolbar">
        <button type="button" className="cms-btn" onClick={() => setEditing({ index: -1, draft: newItem(), isNew: true })}>
          + Add {noun}
        </button>
      </div>
      <ol className="cms-list">
        {items.map((item, i) => {
          const r = row(item);
          return (
            <li key={String(item[idKey] ?? i)}>
              <button type="button" className="cms-list-main" onClick={() => setEditing({ index: i, draft: clone(item), isNew: false })}>
                {r.thumb ? <img src={r.thumb} alt="" loading="lazy" onError={(e) => e.currentTarget.classList.add('broken')} /> : <span className="cms-thumb-empty" aria-hidden="true" />}
                <span>
                  <b>{r.title}</b>
                  {r.sub ? <small>{r.sub}</small> : null}
                </span>
              </button>
              <div className="cms-mini-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${r.title} up`}>
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${r.title} down`}>
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------- case studies ----------

function CoverField({ value, set, state, prefix }: { value: CaseStudy['cover'] | undefined; set: (v: CaseStudy['cover']) => void; state: CmsState; prefix: string }) {
  const v = value ?? { kind: 'photo', id: '' };
  const videoWorks = state.docs.works.data.filter((w) => w.kind === 'video');
  const thumb =
    v.kind === 'youtube' && v.id ? ytPreview(state, v.id) : v.kind === 'video' && v.id ? posterPreview(state, v.id) : v.kind === 'photo' && v.id && state.media.images[v.id] ? previewUrl(state, `public/img/photo/${v.id}-640.webp`, `/img/photo/${v.id}-640.webp?v=${state.media.images[v.id].v}`) : undefined;
  return (
    <div className="cms-cover">
      {thumb ? <img src={thumb} alt="" /> : <span className="cms-photo-empty">No cover yet</span>}
      <div className="cms-fields">
        <div className="cms-field">
          <span className="cms-label">
            <label htmlFor={`${prefix}-ck`}>Cover is a</label>
          </span>
          <select id={`${prefix}-ck`} value={v.kind} onChange={(e) => set({ kind: e.target.value as CaseStudy['cover']['kind'], id: '' })}>
            <option value="photo">photo</option>
            <option value="video">video (one of your works)</option>
            <option value="youtube">YouTube video</option>
          </select>
        </div>
        {v.kind === 'video' ? (
          <div className="cms-field">
            <span className="cms-label">
              <label htmlFor={`${prefix}-cv`}>Which video</label>
            </span>
            <select id={`${prefix}-cv`} value={v.id} onChange={(e) => set({ ...v, id: e.target.value })}>
              <option value="">—</option>
              {videoWorks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                  {w.brand ? ` · ${w.brand}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {v.kind === 'youtube' ? (
          <div className="cms-field">
            <span className="cms-label">
              <label htmlFor={`${prefix}-cy`}>YouTube link</label>
            </span>
            <input id={`${prefix}-cy`} defaultValue={v.id} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => set({ ...v, id: parseYoutube(e.target.value)?.id ?? '' })} />
          </div>
        ) : null}
        {v.kind === 'photo' ? (
          <div className="cms-field">
            <span className="cms-label">Photo</span>
            <div className="cms-row">
              <UploadButton purpose="image" accept="image/*" label="Upload photo" extra={() => ({ id: freshId(`${prefix}-cover`, (id) => Boolean(state.media.images[id] || state.media.videos[id]), 'cover') })} onDone={(r) => set({ kind: 'photo', id: String(r.id) })} />
              <select aria-label="Or choose a photo" value={state.media.images[v.id] ? v.id : ''} onChange={(e) => set({ kind: 'photo', id: e.target.value })}>
                <option value="">or choose one…</option>
                {Object.keys(state.media.images)
                  .sort()
                  .map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CasesEditor({ onDirty }: { onDirty: (d: boolean) => void }) {
  const { state } = useCms();
  const cases = state.docs.cases.data;
  const defs: FieldDef[] = [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'brand', label: 'Brand', type: 'text', required: true },
    { key: 'oneLiner', label: 'One line about it', type: 'textarea', rows: 2, required: true, help: 'Shown on the folder card and at the top of the case.' },
    { key: 'tab', label: 'Folder tab', type: 'text', required: true, help: 'Like “Case 05”.' },
    { key: 'color', label: 'Folder colour', type: 'select', required: true, options: ['ink', 'yellow', 'blue', 'pink'].map((c) => ({ value: c, label: c })) },
    { key: 'period', label: 'When', type: 'text', placeholder: 'Sep 2024 – Jan 2026' },
    { key: 'role', label: 'Your role', type: 'text' },
    { key: 'team', label: 'Team', type: 'text' },
    { key: 'tools', label: 'Tools', type: 'tags' },
    { key: 'tags', label: 'Tags', type: 'tags', required: true },
    { key: 'cover', label: 'Cover', type: 'custom', required: true, render: (v, set, whole) => <CoverField value={v} set={set} state={state} prefix={whole.slug || 'case'} /> },
    { key: 'context', label: 'The context', type: 'textarea', rows: 6 },
    { key: 'brief', label: 'The brief', type: 'textarea', rows: 5 },
    { key: 'idea', label: 'The idea', type: 'textarea', rows: 5 },
    {
      key: 'results',
      label: 'Results',
      type: 'repeat',
      help: 'The first one also shows as a sticker on the home page.',
      fields: [
        { key: 'value', label: 'Number', type: 'text', required: true, placeholder: '2.1M' },
        { key: 'label', label: 'What it means', type: 'text', required: true, placeholder: 'views in a month' },
      ],
      itemLabel: (r) => [r.value, r.label].filter(Boolean).join(' · '),
      newItem: () => ({ value: '', label: '' }),
    },
    { key: 'bts', label: 'Behind-the-scenes photos', type: 'photos', idPrefix: (c) => `${c.slug || 'case'}-bts` },
    { key: 'todo', label: 'Reminders (preview site only)', type: 'lines', help: 'Shown as “still needs” notes on the preview site, never on the live one.' },
  ];
  return (
    <ListDoc<CaseStudy & Obj>
      docKey="cases"
      items={cases as (CaseStudy & Obj)[]}
      idKey="slug"
      noun="case study"
      defs={defs}
      onDirty={onDirty}
      intro={<p className="cms-intro">The featured cases on the home page, in this order. Each has its own page at /work/…, and pieces of work join a case from the Work tab.</p>}
      row={(c) => ({
        title: c.title,
        sub: [c.tab, c.brand, c.period].filter(Boolean).join(' · '),
        thumb: c.cover?.kind === 'youtube' ? ytPreview(state, c.cover.id) : c.cover?.kind === 'video' ? posterPreview(state, c.cover.id) : c.cover?.id && state.media.images[c.cover.id] ? previewUrl(state, `public/img/photo/${c.cover.id}-640.webp`, `/img/photo/${c.cover.id}-640.webp?v=${state.media.images[c.cover.id].v}`) : undefined,
      })}
      newItem={() => ({ slug: '', tab: `Case ${String(cases.length + 1).padStart(2, '0')}`, color: 'ink', brand: '', title: '', oneLiner: '', tags: [], cover: { kind: 'photo', id: '' } }) as CaseStudy & Obj}
      makeId={(c, taken) => freshId(`${c.brand} ${c.title}`, taken, 'case')}
    />
  );
}

// ---------- the journey ----------

export function JourneyEditor({ onDirty }: { onDirty: (d: boolean) => void }) {
  const { state } = useCms();
  const eps = state.docs.episodes.data;
  const defs: FieldDef[] = [
    { key: 'n', label: 'Episode number', type: 'text', required: true, placeholder: '06' },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'company', label: 'Where', type: 'text', required: true },
    { key: 'period', label: 'When', type: 'text', required: true, placeholder: 'Feb 2026 – now' },
    { key: 'logline', label: 'One line', type: 'textarea', rows: 2, required: true, help: 'On the home page’s journey strip.' },
    { key: 'color', label: 'Colour', type: 'select', required: true, options: ['yellow', 'mint', 'pink', 'sky', 'sand'].map((c) => ({ value: c, label: c })) },
    { key: 'story', label: 'The story', type: 'paragraphs', required: true },
    { key: 'notes', label: 'Margin notes', type: 'lines', help: 'Up to two short quotes, shown in blue beside the story.' },
    {
      key: 'roles',
      label: 'Roles',
      type: 'repeat',
      fields: [
        { key: 'company', label: 'Company', type: 'text', required: true },
        { key: 'title', label: 'Job title', type: 'text', required: true },
        { key: 'period', label: 'When', type: 'text', required: true },
        { key: 'aka', label: 'Aka (a joke, optional)', type: 'text' },
        { key: 'notes', label: 'What you did', type: 'textarea', rows: 3, required: true },
      ],
      itemLabel: (r) => [r.title, r.company].filter(Boolean).join(' · '),
      newItem: () => ({ company: '', title: '', period: '', notes: '' }),
    },
    {
      key: 'cameraRoll',
      label: 'Camera roll',
      type: 'repeat',
      fields: [
        { key: 'id', label: 'Photo', type: 'photo', required: true, idPrefix: () => `ep${eps.length}-photo` },
        { key: 'caption', label: 'Caption', type: 'text' },
      ],
      itemLabel: (r) => r.caption || r.id || 'photo',
      newItem: () => ({ id: '' }),
    },
    { key: 'todo', label: 'Reminders (preview site only)', type: 'lines' },
  ];
  return (
    <ListDoc<Episode & Obj>
      docKey="episodes"
      items={eps as (Episode & Obj)[]}
      idKey="slug"
      noun="episode"
      defs={defs}
      onDirty={onDirty}
      intro={<p className="cms-intro">The Journey page, one episode at a time. The home page shows each episode’s one-liner.</p>}
      row={(e) => ({ title: `EP ${e.n} · ${e.title}`, sub: `${e.company} · ${e.period}` })}
      newItem={() => ({ n: String(eps.length + 1).padStart(2, '0'), slug: '', title: '', company: '', period: '', logline: '', color: 'yellow', roles: [], story: [], notes: [], cameraRoll: [] }) as Episode & Obj}
      makeId={(e, taken) => freshId(`ep-${e.n}`, taken, 'ep')}
    />
  );
}

// ---------- the site's text ----------

const SITE_SECTIONS: { title: string; note?: string; defs: FieldDef[] }[] = [
  {
    title: 'You',
    defs: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'shortName', label: 'First name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text', required: true },
      { key: 'hometown', label: 'Hometown', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
    ],
  },
  {
    title: 'Home page: the top',
    defs: [
      { key: 'tagline', label: 'Headline', type: 'textarea', rows: 2, required: true },
      { key: 'status', label: 'Status line', type: 'text', required: true, help: 'Next to the green dot.' },
      { key: 'cycleWords', label: '“Sometimes it’s …” words', type: 'lines', required: true },
      {
        key: 'heroStickers',
        label: 'Stickers around your name',
        type: 'repeat',
        min: 2,
        help: 'The first two sit either side of your name, the rest underneath.',
        fields: [
          { key: 'text', label: 'Text', type: 'text', required: true },
          { key: 'color', label: 'Colour', type: 'select', required: true, options: STICKER_COLORS },
          { key: 'r', label: 'Tilt (degrees, −8 to 8)', type: 'number' },
        ],
        itemLabel: (s) => s.text,
        newItem: () => ({ text: '', color: 'yellow', r: -3 }),
      },
    ],
  },
  {
    title: 'About you',
    defs: [
      { key: 'aboutShort', label: 'Short about (home page)', type: 'lines', required: true, help: 'One sentence per line; they’re joined into one paragraph.' },
      { key: 'aboutFull', label: '“Who am I” (top of the Journey page)', type: 'textarea', rows: 14, required: true, help: 'The first two paragraphs are shown.' },
      { key: 'readingList', label: 'I like to read about', type: 'tags' },
      {
        key: 'skills',
        label: 'Skill tickets',
        type: 'repeat',
        fields: [
          { key: 'label', label: 'Skill', type: 'text', required: true },
          { key: 'emoji', label: 'Two emoji (they swap)', type: 'pair', required: true, placeholder: ['✨', '💡'] },
          { key: 'color', label: 'Colour', type: 'select', required: true, options: STICKER_COLORS },
        ],
        itemLabel: (s) => s.label,
        newItem: () => ({ label: '', emoji: ['✨', '💡'], color: 'yellow' }),
      },
    ],
  },
  {
    title: 'Brands and links',
    defs: [
      { key: 'brands', label: '“Worked with” brands', type: 'lines', required: true },
      {
        key: 'socials',
        label: 'Social links',
        type: 'repeat',
        fields: [
          { key: 'id', label: 'Network', type: 'select', required: true, options: ['instagram', 'linkedin', 'youtube', 'x', 'github'].map((c) => ({ value: c, label: c })) },
          { key: 'label', label: 'Name shown', type: 'text', required: true },
          { key: 'handle', label: 'Handle', type: 'text', required: true },
          { key: 'href', label: 'Link', type: 'url', required: true },
        ],
        itemLabel: (s) => `${s.label} ${s.handle ?? ''}`,
        newItem: () => ({ id: 'instagram', label: '', handle: '', href: 'https://' }),
      },
    ],
  },
  {
    title: 'Playground',
    note: 'The collage has room for three of each.',
    defs: [
      {
        key: 'stupidIdeas',
        label: 'Stupid ideas',
        type: 'repeat',
        max: 3,
        fields: [
          { key: 'n', label: 'Number', type: 'text', required: true },
          { key: 'text', label: 'The idea', type: 'textarea', rows: 2, required: true },
        ],
        itemLabel: (s) => s.text,
        newItem: () => ({ n: '0', text: '' }),
      },
      {
        key: 'sideProjects',
        label: 'Side projects',
        type: 'repeat',
        max: 3,
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'note', label: 'One line', type: 'text', required: true },
          { key: 'href', label: 'Link', type: 'url' },
          { key: 'file', label: 'Or a document id (PDF)', type: 'text', help: 'Instead of a link: a document from content/media.json.' },
        ],
        itemLabel: (s) => s.name,
        newItem: () => ({ name: '', note: '', href: 'https://' }),
      },
    ],
  },
  {
    title: 'Search engines and link previews',
    defs: [
      { key: 'description', label: 'Site description', type: 'textarea', rows: 3, required: true },
      { key: 'url', label: 'Site address', type: 'url', required: true },
    ],
  },
];

export function SiteEditor({ onDirty }: { onDirty: (d: boolean) => void }) {
  const { state, save } = useCms();
  const [draft, setDraft] = useState<SiteContent>(() => clone(state.docs.site.data));
  const [dirty, setDirty] = useState(false);
  const resumePending = state.pending.files.includes('public/resume.pdf');
  return (
    <div className="cms-editor">
      <p className="cms-intro">The words around the site: the home page’s top, the about text, your links, the playground notes.</p>
      {SITE_SECTIONS.map((s) => (
        <section key={s.title} className="cms-section">
          <h3>{s.title}</h3>
          {s.note ? <p className="cms-muted">{s.note}</p> : null}
          <Fields
            defs={s.defs}
            value={draft as unknown as Obj}
            onChange={(v) => {
              setDraft(v as unknown as SiteContent);
              setDirty(true);
              onDirty(true);
            }}
          />
        </section>
      ))}
      <section className="cms-section">
        <h3>Resume</h3>
        <p className="cms-muted">
          The PDF behind every “Resume” button.{' '}
          <a href={resumePending ? '/api/cms/file?path=public%2Fresume.pdf' : '/resume.pdf'} target="_blank" rel="noopener">
            {resumePending ? 'See the new one (unpublished)' : 'See the current one'} ↗
          </a>
        </p>
        <UploadButton purpose="resume" accept="application/pdf" label="Upload a new resume (PDF)" extra={() => ({})} onDone={() => undefined} />
      </section>
      <div className="cms-form-actions sticky">
        <button
          type="button"
          className="cms-btn"
          disabled={!dirty}
          onClick={async () => {
            if (await save('site', draft, 'Edit site text')) {
              setDirty(false);
              onDirty(false);
            }
          }}
        >
          {dirty ? 'Save' : 'Saved'}
        </button>
        {dirty ? (
          <button
            type="button"
            className="cms-btn ghost"
            onClick={() => {
              if (!leave(true)) return;
              setDraft(clone(state.docs.site.data));
              setDirty(false);
              onDirty(false);
            }}
          >
            Undo edits
          </button>
        ) : null}
      </div>
    </div>
  );
}
