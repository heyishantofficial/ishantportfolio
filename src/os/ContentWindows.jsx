import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Download, ExternalLink, Send, Minus, Plus, Trash2, Check
} from 'lucide-react';
import OSWindow from './OSWindow';
import NodeIcon from './NodeIcon';
import { findNode, getPath, itemCount, itemCountLabel, PROJECT_SEQUENCE, TRASH_ITEMS } from '../data/ishantOS';
import { PROFILE_INFO } from '../data/projectsData';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '../utils/mediaHelpers';

const chrome = (props) => ({
  win: props.win,
  isActive: props.isActive,
  isCompact: props.isCompact,
  onClose: props.onClose,
  onMinimize: props.onMinimize,
  onToggleMaximize: props.onToggleMaximize,
  onFocus: props.onFocus,
  onMove: props.onMove,
  onResize: props.onResize
});

/* ------------------------------------------------------------------ *
 * Text files — the .txt content, in a TextEdit-ish sheet
 * ------------------------------------------------------------------ */

export function TextWindow(props) {
  const node = findNode(props.win.nodeId);
  if (!node) return null;

  return (
    <OSWindow {...chrome(props)} title={node.name} subtitle={getPath(node.id).at(-2)?.name}>
      <div className="h-full overflow-y-auto bg-[#fdfdfb] dark:bg-slate-900">
        <pre className="p-6 sm:p-8 font-mono text-[12px] sm:text-[12.5px] leading-[1.75] text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
          {node.body}
        </pre>
      </div>
    </OSWindow>
  );
}

/* ------------------------------------------------------------------ *
 * Case study — big visual, role, idea, execution, result, prev/next
 * ------------------------------------------------------------------ */

export function ProjectWindow(props) {
  const [currentId, setCurrentId] = useState(props.win.nodeId);
  const node = findNode(currentId);
  const p = node?.project;

  const index = PROJECT_SEQUENCE.findIndex((n) => n.id === currentId);
  const prev = index > 0 ? PROJECT_SEQUENCE[index - 1] : null;
  const next = index >= 0 && index < PROJECT_SEQUENCE.length - 1 ? PROJECT_SEQUENCE[index + 1] : null;

  if (!p) return null;
  const accent = p.accent || '#c0392b';

  return (
    <OSWindow {...chrome(props)} title={p.title} subtitle={p.category}>
      <div className="h-full overflow-y-auto bg-white dark:bg-slate-900">
        {/* Big visual — typographic rather than a stock photo standing in for work */}
        <div
          className="relative h-40 sm:h-52 flex flex-col justify-end p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, #1a1a1a 130%)` }}
        >
          {p.status && (
            <span className="absolute top-4 right-5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-[10px] font-bold tracking-widest">
              {p.status}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
            {p.category} · {p.year}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none mt-1.5">{p.title}</h1>
          {p.description && <p className="text-[12px] sm:text-[13px] opacity-90 mt-2 max-w-2xl">{p.description}</p>}
        </div>

        <div className="p-6 sm:p-8 space-y-7 max-w-3xl">
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pb-6 border-b border-black/10 dark:border-white/10">
            <Meta label="Role" value={p.role} />
            {p.client && <Meta label="Client" value={p.client} />}
            <Meta label="Year" value={p.year} />
          </dl>

          {p.problem && <Section title="The Problem" body={p.problem} />}
          {p.idea && <Section title="The Idea" body={p.idea} />}

          {Array.isArray(p.execution) && p.execution.length > 0 && (
            <section>
              <SectionHeading accent={accent}>The Execution</SectionHeading>
              <ul className="space-y-2">
                {p.execution.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <span className="font-mono text-[10px] pt-1 shrink-0" style={{ color: accent }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.result && <Section title="The Result" body={p.result} accent={accent} />}

          {(p.stack?.length > 0 || p.tags?.length > 0) && (
            <section className="pt-2">
              <SectionHeading accent={accent}>Built With</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {[...(p.stack || []), ...(p.tags || [])].map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {p.links?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {p.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white"
                  style={{ background: accent }}
                >
                  {l.label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Previous / Next through every case study in the tree */}
        <nav className="sticky bottom-0 flex items-center justify-between gap-2 px-5 py-3 border-t border-black/10 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
          <button
            onClick={() => prev && setCurrentId(prev.id)}
            disabled={!prev}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 enabled:hover:text-[var(--os-accent)] disabled:opacity-30 min-w-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{prev ? prev.name : 'Start'}</span>
          </button>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {index + 1} / {PROJECT_SEQUENCE.length}
          </span>
          <button
            onClick={() => next && setCurrentId(next.id)}
            disabled={!next}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 enabled:hover:text-[var(--os-accent)] disabled:opacity-30 min-w-0"
          >
            <span className="truncate">{next ? next.name : 'End'}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </nav>
      </div>
    </OSWindow>
  );
}

function SectionHeading({ children, accent = '#c0392b' }) {
  return (
    <h2 className="text-[10px] font-black uppercase tracking-[0.18em] mb-2.5" style={{ color: accent }}>
      {children}
    </h2>
  );
}

function Section({ title, body, accent }) {
  return (
    <section>
      <SectionHeading accent={accent}>{title}</SectionHeading>
      <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">{body}</p>
    </section>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Resume — kept one click away, never buried behind the metaphor
 * ------------------------------------------------------------------ */

export function PdfWindow(props) {
  const node = findNode(props.win.nodeId);
  const [zoom, setZoom] = useState(1);
  if (!node) return null;

  return (
    <OSWindow {...chrome(props)} title={node.name} subtitle={PROFILE_INFO.name}>
      <div className="h-full flex flex-col bg-slate-200 dark:bg-slate-950">
        <div className="shrink-0 h-9 px-3 flex items-center gap-2 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
            aria-label="Zoom out"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono w-10 text-center text-slate-500">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
            aria-label="Zoom in"
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <a
              href={node.file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <ExternalLink className="w-3 h-3" /> Open externally
            </a>
            <a
              href={node.file}
              download
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-[var(--os-accent)] hover:brightness-110"
            >
              <Download className="w-3 h-3" /> Download
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <img
            src={node.preview}
            alt={`${PROFILE_INFO.name} resume`}
            style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
            className="h-fit shadow-2xl bg-white rounded-sm"
          />
        </div>
      </div>
    </OSWindow>
  );
}

/* ------------------------------------------------------------------ *
 * Media / Preview — uploaded images, videos, audio, documents
 * ------------------------------------------------------------------ */

export function MediaWindow(props) {
  const node = findNode(props.win.nodeId);
  const [zoom, setZoom] = useState(1);
  if (!node) return null;

  const fileUrl = node.dataUrl || node.file || node.videoUrl || node.href || node.preview;
  const isImage = node.kind === 'image';
  const isYt = isYouTubeUrl(node.videoUrl || node.href || fileUrl);
  const ytEmbed = isYt ? getYouTubeEmbedUrl(node.videoUrl || node.href || fileUrl) : null;
  const isVideo = node.kind === 'video' || isYt;
  const isAudio = node.kind === 'audio';
  const externalLink = node.href || (isYt ? (node.href || fileUrl) : null);

  return (
    <OSWindow {...chrome(props)} title={node.name} subtitle={node.description || (isYt ? 'YouTube Video' : 'Media Preview')}>
      <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-950">
        <div className="shrink-0 h-9 px-3 flex items-center gap-2 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70">
          {isImage && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.15).toFixed(2)))}
                aria-label="Zoom out"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono w-10 text-center text-slate-500">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
                aria-label="Zoom in"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-2 py-0.5 rounded text-[10px] font-medium hover:bg-black/10 dark:hover:bg-white/10 text-slate-500"
              >
                Actual Size
              </button>
            </>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {externalLink && (
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10"
              >
                <ExternalLink className="w-3 h-3" /> {isYt ? 'Watch on YouTube' : 'Open in Browser'}
              </a>
            )}
            {fileUrl && !isYt && !externalLink && (
              <a
                href={fileUrl}
                download={node.name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-[var(--os-accent)] hover:brightness-110"
              >
                <Download className="w-3 h-3" /> Download
              </a>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {isImage ? (
            <img
              src={fileUrl}
              alt={node.name}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
              className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-md bg-transparent select-none"
            />
          ) : isVideo ? (
            ytEmbed ? (
              <div className="w-full h-full p-2 sm:p-4 flex items-center justify-center">
                <div className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-black/20">
                  <iframe
                    src={ytEmbed}
                    title={node.name}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <video
                src={fileUrl}
                controls
                autoPlay
                className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl bg-black"
              />
            )
          ) : isAudio ? (
            <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-black/10 dark:border-white/10 max-w-sm w-full">
              <NodeIcon node={node} size={64} />
              <div className="text-center">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">{node.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{node.description}</p>
              </div>
              <audio src={fileUrl} controls className="w-full mt-2" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-black/10 dark:border-white/10 max-w-sm text-center">
              <NodeIcon node={node} size={64} />
              <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">{node.name}</h4>
              <p className="text-[12px] text-slate-500">{node.description || 'Generic File'}</p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  download={node.name}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-[#007aff] hover:bg-[#0069dc]"
                >
                  <Download className="w-4 h-4" /> Download File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </OSWindow>
  );
}

/* ------------------------------------------------------------------ *
 * Mail — a compose sheet that hands off to the visitor's real client
 * ------------------------------------------------------------------ */

export function MailWindow(props) {
  const [subject, setSubject] = useState("Let's work together");
  const [body, setBody] = useState('Hi Ishant,\n\nI found your portfolio...');

  const mailto = `mailto:${PROFILE_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <OSWindow {...chrome(props)} title="New Message" subtitle={PROFILE_INFO.email}>
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">
        <div className="shrink-0 px-4 py-2 border-b border-black/10 dark:border-white/10 space-y-1.5">
          <Field label="To">
            <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              Ishant &lt;{PROFILE_INFO.email}&gt;
            </span>
          </Field>
          <Field label="Subject">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Subject"
              className="w-full bg-transparent text-[12px] font-semibold text-slate-800 dark:text-slate-100 outline-none"
            />
          </Field>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Message"
          className="flex-1 w-full p-4 bg-transparent resize-none outline-none text-[13px] leading-relaxed text-slate-800 dark:text-slate-200"
        />

        <div className="shrink-0 px-4 py-3 border-t border-black/10 dark:border-white/10 flex items-center gap-3">
          <a
            href={mailto}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--os-accent)] text-white text-[11px] font-bold hover:brightness-110"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </a>
          <span className="text-[10px] text-slate-400">Opens in your own mail app.</span>
        </div>
      </div>
    </OSWindow>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Get Info
 * ------------------------------------------------------------------ */

export function InfoWindow(props) {
  const node = findNode(props.win.nodeId);
  if (!node) return null;

  const meta = node.meta || {};
  const rows = [
    ['Kind', node.kind === 'folder' ? 'Folder' : node.kind === 'project' ? 'Case Study' : node.kind === 'pdf' ? 'PDF Document' : node.kind === 'text' ? 'Text Document' : 'Item'],
    ['Size', meta.size || (node.kind === 'folder' ? itemCountLabel(node) : '—')],
    ['Items', node.kind === 'folder' ? String(itemCount(node)) : '—'],
    ['Created', node.createdAt || '—'],
    ['Modified', node.modifiedAt || 'Today'],
    ['Where', getPath(node.id).slice(0, -1).map((p) => p.name).join(' / ') || 'IshantOS']
  ];

  return (
    <OSWindow {...chrome(props)} title={`${node.name} Info`}>
      <div className="h-full overflow-y-auto p-5 bg-white/95 dark:bg-slate-900/95">
        <div className="flex flex-col items-center text-center pb-4 mb-4 border-b border-black/10 dark:border-white/10">
          <NodeIcon node={node} size={64} />
          <h2 className="mt-2 text-[13px] font-bold text-slate-900 dark:text-slate-50">{node.name}</h2>
          {node.description && <p className="text-[11px] text-slate-500 mt-1">{node.description}</p>}
        </div>

        <dl className="space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-3 text-[11px]">
              <dt className="w-20 shrink-0 font-bold text-slate-400 uppercase tracking-wider text-[9px] pt-0.5">{label}</dt>
              <dd className="flex-1 text-slate-700 dark:text-slate-300 font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {(meta.owner || meta.status) && (
          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
            {meta.owner && (
              <div className="text-[11px]">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Owner</div>
                <div className="font-medium text-slate-700 dark:text-slate-300">{meta.owner}</div>
              </div>
            )}
            {meta.status && (
              <div className="text-[11px]">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</div>
                <div className="font-medium text-slate-700 dark:text-slate-300">{meta.status}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </OSWindow>
  );
}

/* ------------------------------------------------------------------ *
 * Trash — easter egg, nothing important lives here
 * ------------------------------------------------------------------ */

export function TrashWindow(props) {
  const [stage, setStage] = useState('full'); // full | confirm | emptied
  const items = useMemo(() => TRASH_ITEMS, []);

  return (
    <OSWindow {...chrome(props)} title="Trash">
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">
        <div className="flex-1 overflow-y-auto p-4">
          {stage === 'emptied' ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
              <Check className="w-8 h-8 text-emerald-500" />
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Trash emptied.</p>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Except the sleep schedule.<br />That&apos;s still missing.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-[12px] text-slate-700 dark:text-slate-300"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 border-t border-black/10 dark:border-white/10 flex items-center gap-3">
          {stage === 'full' && (
            <>
              <button
                onClick={() => setStage('confirm')}
                className="px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-black/10"
              >
                Empty Trash
              </button>
              <span className="text-[10px] text-slate-400">{items.length} items</span>
            </>
          )}
          {stage === 'confirm' && (
            <>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                Are you sure? Some things cannot be recovered.
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setStage('full')}
                  className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStage('emptied')}
                  className="px-3 py-1 rounded-full bg-[var(--os-accent)] text-white text-[11px] font-bold"
                >
                  Empty
                </button>
              </div>
            </>
          )}
          {stage === 'emptied' && <span className="text-[10px] text-slate-400">0 items</span>}
        </div>
      </div>
    </OSWindow>
  );
}
