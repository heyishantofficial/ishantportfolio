'use client';

// Form building blocks for the admin. A form is a list of field definitions;
// <Fields> renders them against a value object and reports a new object on change.

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { freshId, photoPreview, posterPreview, upload, type CmsState, type DocKey, type Progress, type Purpose } from './api';

/* oxlint-disable typescript/no-explicit-any */
type Obj = Record<string, any>;

export interface Ctx {
  state: CmsState;
  /** Reload the CMS state (media, pending changes) without touching open forms. */
  refresh: () => Promise<void>;
  toast: (msg: string, kind?: 'ok' | 'error') => void;
  /** Save a whole document as an unpublished change. Resolves false if the server refused it. */
  save: <K extends DocKey>(doc: K, data: CmsState['docs'][K]['data'], note: string) => Promise<boolean>;
}
export const CmsContext = createContext<Ctx | null>(null);
export const useCms = () => {
  const c = useContext(CmsContext);
  if (!c) throw new Error('CmsContext missing');
  return c;
};

type Base = { key: string; label: string; help?: string; required?: boolean; wide?: boolean };
export type FieldDef =
  | (Base & { type: 'text' | 'textarea' | 'url' | 'email' | 'date'; rows?: number; placeholder?: string })
  | (Base & { type: 'select'; options: { value: string; label: string }[] })
  | (Base & { type: 'check' })
  | (Base & { type: 'number'; step?: number })
  | (Base & { type: 'lines' | 'paragraphs' | 'tags'; rows?: number; placeholder?: string })
  | (Base & { type: 'pair'; placeholder?: [string, string] })
  | (Base & { type: 'repeat'; fields: FieldDef[]; itemLabel: (item: Obj, i: number) => string; newItem: () => Obj; min?: number; max?: number })
  | (Base & { type: 'photo' | 'photos'; idPrefix: (value: Obj) => string })
  | (Base & { type: 'custom'; render: (value: any, set: (v: any) => void, whole: Obj) => ReactNode });

const emptyish = (v: unknown) => v === undefined || v === null || v === '';

/** A copy of `obj` with `key` set; empty optional values are removed so the JSON stays tidy. */
function withKey(obj: Obj, def: FieldDef, v: unknown): Obj {
  const next = { ...obj };
  if (emptyish(v) && !def.required) delete next[def.key];
  else next[def.key] = v;
  return next;
}

export function Fields({ defs, value, onChange }: { defs: FieldDef[]; value: Obj; onChange: (v: Obj) => void }) {
  return (
    <div className="cms-fields">
      {defs.map((d) => (
        <Field key={d.key} def={d} value={value[d.key]} whole={value} onChange={(v) => onChange(withKey(value, d, v))} />
      ))}
    </div>
  );
}

function Label({ def, htmlFor }: { def: FieldDef; htmlFor?: string }) {
  return (
    <span className="cms-label">
      <label htmlFor={htmlFor}>
        {def.label}
        {def.required ? <b aria-hidden="true"> *</b> : null}
      </label>
      {def.help ? <small>{def.help}</small> : null}
    </span>
  );
}

/** A textarea whose text is turned into a list. Keeps what you type (blank lines too) until you leave it. */
function ListText({ id, value, toText, fromText, rows, placeholder, onChange }: { id: string; value: unknown; toText: (v: any) => string; fromText: (s: string) => unknown; rows?: number; placeholder?: string; onChange: (v: unknown) => void }) {
  const [text, setText] = useState(() => toText(value ?? []));
  return (
    <textarea
      id={id}
      rows={rows ?? Math.min(12, Math.max(3, text.split('\n').length + 1))}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(fromText(e.target.value));
      }}
    />
  );
}

export function Field({ def, value, whole, onChange }: { def: FieldDef; value: any; whole: Obj; onChange: (v: any) => void }) {
  const id = useId();
  const cls = `cms-field${def.wide || ['textarea', 'paragraphs', 'repeat', 'photos', 'lines', 'custom'].includes(def.type) ? ' wide' : ''}`;
  switch (def.type) {
    case 'text':
    case 'url':
    case 'email':
    case 'date':
      return (
        <div className={cls}>
          <Label def={def} htmlFor={id} />
          <input id={id} type={def.type === 'text' ? 'text' : def.type} value={value ?? ''} placeholder={def.placeholder} required={def.required} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case 'textarea':
      return (
        <div className={cls}>
          <Label def={def} htmlFor={id} />
          <textarea id={id} rows={def.rows ?? 4} value={value ?? ''} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case 'number':
      return (
        <div className={cls}>
          <Label def={def} htmlFor={id} />
          <input id={id} type="number" step={def.step ?? 1} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
        </div>
      );
    case 'select':
      return (
        <div className={cls}>
          <Label def={def} htmlFor={id} />
          <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {def.required ? null : <option value="">—</option>}
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    case 'check':
      return (
        <div className={cls}>
          <label className="cms-check">
            <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked || undefined)} />
            <span>
              {def.label}
              {def.help ? <small>{def.help}</small> : null}
            </span>
          </label>
        </div>
      );
    case 'lines':
      return (
        <div className={cls}>
          <Label def={{ ...def, help: def.help ?? 'One per line.' }} htmlFor={id} />
          <ListText id={id} value={value} rows={def.rows} placeholder={def.placeholder} toText={(v: string[]) => v.join('\n')} fromText={(s) => s.split('\n').map((x) => x.trim()).filter(Boolean)} onChange={onChange} />
        </div>
      );
    case 'paragraphs':
      return (
        <div className={cls}>
          <Label def={{ ...def, help: def.help ?? 'Leave an empty line between paragraphs. Single line breaks are kept.' }} htmlFor={id} />
          <ListText
            id={id}
            value={value}
            rows={def.rows ?? 14}
            placeholder={def.placeholder}
            toText={(v: string[]) => v.join('\n\n')}
            fromText={(s) =>
              s
                .split(/\n[ \t]*\n/)
                .map((x) => x.replace(/^\n+|\s+$/g, ''))
                .filter(Boolean)
            }
            onChange={onChange}
          />
        </div>
      );
    case 'tags':
      return (
        <div className={cls}>
          <Label def={{ ...def, help: def.help ?? 'Separate with commas.' }} htmlFor={id} />
          <ListText id={id} value={value} rows={1} placeholder={def.placeholder} toText={(v: string[]) => v.join(', ')} fromText={(s) => s.split(',').map((x) => x.trim()).filter(Boolean)} onChange={onChange} />
        </div>
      );
    case 'pair': {
      const v: [string, string] = Array.isArray(value) ? [value[0] ?? '', value[1] ?? ''] : ['', ''];
      return (
        <div className={cls}>
          <Label def={def} htmlFor={id} />
          <div className="cms-pair">
            <input id={id} value={v[0]} placeholder={def.placeholder?.[0]} onChange={(e) => onChange([e.target.value, v[1]])} />
            <input value={v[1]} placeholder={def.placeholder?.[1]} aria-label={`${def.label} (second)`} onChange={(e) => onChange([v[0], e.target.value])} />
          </div>
        </div>
      );
    }
    case 'repeat':
      return (
        <div className={cls}>
          <Label def={def} />
          <Repeat def={def} value={Array.isArray(value) ? value : []} onChange={onChange} />
        </div>
      );
    case 'photo':
      return (
        <div className={cls}>
          <Label def={def} />
          <PhotoField value={value} prefix={def.idPrefix(whole)} onChange={onChange} />
        </div>
      );
    case 'photos':
      return (
        <div className={cls}>
          <Label def={def} />
          <PhotosField value={Array.isArray(value) ? value : []} prefix={def.idPrefix(whole)} onChange={onChange} />
        </div>
      );
    case 'custom':
      return (
        <div className={cls}>
          <Label def={def} />
          {def.render(value, onChange, whole)}
        </div>
      );
  }
}

let keySeq = 0;
const newKey = () => `k${++keySeq}`;

function Repeat({ def, value, onChange }: { def: Extract<FieldDef, { type: 'repeat' }>; value: Obj[]; onChange: (v: Obj[]) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  // Stable keys while items move around, so an open item stays open.
  const [keys, setKeys] = useState<string[]>(() => value.map(() => newKey()));
  const keyAt = (i: number) => keys[i] ?? `i${i}`;
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const swap = <T,>(arr: T[]) => {
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    };
    onChange(swap(value));
    setKeys(swap(keys));
    if (open === i) setOpen(j);
  };
  const canRemove = value.length > (def.min ?? 0);
  const canAdd = def.max === undefined || value.length < def.max;
  return (
    <div className="cms-repeat">
      {value.map((item, i) => (
        <div key={keyAt(i)} className={`cms-repeat-item${open === i ? ' open' : ''}`}>
          <div className="cms-repeat-head">
            <button type="button" className="cms-repeat-title" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span aria-hidden="true">{open === i ? '▾' : '▸'}</span> {def.itemLabel(item, i) || `#${i + 1}`}
            </button>
            <div className="cms-mini-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down">
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  setKeys(keys.filter((_, j) => j !== i));
                  onChange(value.filter((_, j) => j !== i));
                  setOpen(null);
                }}
                disabled={!canRemove}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          </div>
          {open === i ? (
            <div className="cms-repeat-body">
              <Fields defs={def.fields} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
            </div>
          ) : null}
        </div>
      ))}
      {canAdd ? (
        <button
          type="button"
          className="cms-btn ghost small"
          onClick={() => {
            setKeys([...keys, newKey()]);
            onChange([...value, def.newItem()]);
            setOpen(value.length);
          }}
        >
          + add
        </button>
      ) : null}
      {def.min && value.length <= def.min ? <small className="cms-muted">The site needs at least {def.min}.</small> : null}
    </div>
  );
}

// ---------- uploads ----------

export function ProgressBar({ p }: { p: Progress }) {
  return (
    <div className={`cms-progress ${p.stage}`} role="status">
      <div className="cms-progress-bar">
        <i style={{ width: `${Math.round(p.value * 100)}%` }} />
      </div>
      <small>{p.message}</small>
    </div>
  );
}

/** A file button that uploads, shows progress, and hands back the job's result. */
export function UploadButton({
  purpose,
  accept,
  label,
  extra,
  multiple,
  onDone,
  className = 'cms-btn ghost small',
}: {
  purpose: Purpose;
  accept: string;
  label: string;
  extra: (file: File, index: number) => Record<string, unknown> | null;
  multiple?: boolean;
  onDone: (result: Record<string, any>, file: File) => void | Promise<void>;
  className?: string;
}) {
  const { refresh, toast } = useCms();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const busy = progress !== null && progress.stage !== 'done' && progress.stage !== 'error';
  return (
    <span className="cms-upload">
      <button type="button" className={className} disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Working…' : label}
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          for (const [i, file] of files.entries()) {
            const ex = extra(file, i);
            if (!ex) continue;
            try {
              setProgress({ stage: 'uploading', value: 0, message: files.length > 1 ? `File ${i + 1} of ${files.length}` : 'Starting…' });
              const result = await upload(file, purpose, ex, setProgress);
              await refresh();
              await onDone(result, file);
            } catch (err) {
              setProgress({ stage: 'error', value: 0, message: (err as Error).message });
              toast((err as Error).message, 'error');
              return;
            }
          }
          setProgress(null);
        }}
      />
      {progress ? <ProgressBar p={progress} /> : null}
    </span>
  );
}

function usePhotoIds() {
  const { state } = useCms();
  return useMemo(() => Object.keys(state.media.images).sort(), [state.media.images]);
}

/** Choose one of the photos already on the site. */
export function PhotoPicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const { state } = useCms();
  const ids = usePhotoIds();
  const [q, setQ] = useState('');
  const shown = ids.filter((id) => id.includes(q.toLowerCase()));
  return (
    <div className="cms-picker" role="dialog" aria-label="Choose a photo">
      <div className="cms-picker-head">
        <input autoFocus placeholder="Search photos…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="cms-btn ghost small" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="cms-picker-grid">
        {shown.map((id) => (
          <button key={id} type="button" onClick={() => onPick(id)} title={id}>
            <img src={photoPreview(state, id)} alt="" loading="lazy" />
            <small>{id}</small>
          </button>
        ))}
        {shown.length === 0 ? <p className="cms-muted">No photos match.</p> : null}
      </div>
    </div>
  );
}

function PhotoField({ value, prefix, onChange }: { value?: string; prefix: string; onChange: (id: string | undefined) => void }) {
  const { state } = useCms();
  const [picking, setPicking] = useState(false);
  // Camera rolls can also hold a video clip's id: show its poster.
  const src = value ? (photoPreview(state, value) ?? posterPreview(state, value)) : undefined;
  return (
    <div className="cms-photo">
      {src ? <img src={src} alt="" /> : <span className="cms-photo-empty">{value ? `“${value}” isn't a photo or a clip` : 'No photo'}</span>}
      <div className="cms-row">
        <UploadButton purpose="image" accept="image/*" label={value ? 'Upload new' : 'Upload'} extra={() => ({ id: freshId(prefix, (id) => Boolean(state.media.images[id] || state.media.videos[id]), 'photo') })} onDone={(r) => onChange(String(r.id))} />
        <button type="button" className="cms-btn ghost small" onClick={() => setPicking(true)}>
          Choose existing
        </button>
        {value ? (
          <button type="button" className="cms-btn ghost small" onClick={() => onChange(undefined)}>
            Remove
          </button>
        ) : null}
      </div>
      {picking ? (
        <PhotoPicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            onChange(id);
            setPicking(false);
          }}
        />
      ) : null}
    </div>
  );
}

function PhotosField({ value, prefix, onChange }: { value: string[]; prefix: string; onChange: (ids: string[]) => void }) {
  const { state } = useCms();
  const [picking, setPicking] = useState(false);
  // Several uploads finish one after another; each adds to the newest list.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  return (
    <div className="cms-photos">
      <div className="cms-photo-strip">
        {value.map((id, i) => (
          <figure key={`${id}-${i}`}>
            {photoPreview(state, id) ? <img src={photoPreview(state, id)} alt="" /> : <span className="cms-photo-empty">{id}</span>}
            <div className="cms-mini-actions">
              <button type="button" disabled={i === 0} onClick={() => onChange(value.map((x, j) => (j === i - 1 ? value[i] : j === i ? value[i - 1] : x)))} aria-label="Move left">
                ←
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">
                ✕
              </button>
            </div>
          </figure>
        ))}
      </div>
      <div className="cms-row">
        <UploadButton
          purpose="image"
          accept="image/*"
          multiple
          label="Upload photos"
          extra={(_f, i) => ({ id: freshId(`${prefix}-${Date.now().toString(36).slice(-4)}${i}`, (id) => Boolean(state.media.images[id] || state.media.videos[id]), 'photo') })}
          onDone={(r) => onChange([...latest.current, String(r.id)])}
        />
        <button type="button" className="cms-btn ghost small" onClick={() => setPicking(true)}>
          Add existing
        </button>
      </div>
      {picking ? (
        <PhotoPicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            onChange([...value, id]);
            setPicking(false);
          }}
        />
      ) : null}
    </div>
  );
}
