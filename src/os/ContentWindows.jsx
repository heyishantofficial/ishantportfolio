import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Download, ExternalLink, Send, Minus, Plus, Trash2, Check,
  Save, Lock, RotateCcw, ShieldCheck, Type, Copy, FileText
} from 'lucide-react';
import OSWindow from './OSWindow';
import NodeIcon from './NodeIcon';
import { findNode, getPath, itemCount, itemCountLabel, PROJECT_SEQUENCE, TRASH_ITEMS } from '../data/ishantOS';
import { PROFILE_INFO } from '../data/projectsData';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '../utils/mediaHelpers';
import { useAdminAuth } from '../utils/useAdminAuth';
import { useFileSystem } from '../utils/useFileSystem';

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
 * Text files — Apple TextEdit / Notes editor with Admin Mode saving
 * ------------------------------------------------------------------ */

function AdminTextEditor({ node, subtitle, updateFileContent, ...props }) {
  const { lock } = useAdminAuth();
  const [body, setBody] = useState(node?.body || '');
  const [savedBody, setSavedBody] = useState(node?.body || '');
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [copied, setCopied] = useState(false);
  const [fontFamily, setFontFamily] = useState('mono'); // 'mono' | 'sans'
  const textareaRef = useRef(null);

  // Sync state if node changes
  useEffect(() => {
    if (node) {
      setBody(node.body || '');
      setSavedBody(node.body || '');
    }
  }, [node]);

  const isDirty = body !== savedBody;

  // Save handler
  const handleSave = useCallback(async () => {
    if (!node) return;
    setSaveState('saving');
    const ok = await updateFileContent(node.id, body);
    if (ok) {
      setSavedBody(body);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } else {
      setSaveState('idle');
    }
  }, [node, body, updateFileContent]);

  // Global Cmd+S / Ctrl+S listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        if (props.isActive) {
          e.preventDefault();
          e.stopPropagation();
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, props.isActive]);

  const handleKeyDownTextarea = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newBody = body.substring(0, start) + '  ' + body.substring(end);
      setBody(newBody);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = node?.name || 'notes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = useMemo(() => body.split('\n'), [body]);
  const wordsCount = useMemo(() => (body.trim() ? body.trim().split(/\s+/).length : 0), [body]);
  const charsCount = body.length;

  const editorToolbar = (
    <div className="flex items-center justify-between w-full min-w-0 pr-2 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="w-3.5 h-3.5 text-[#007aff] shrink-0" />
        <span className="text-[12.5px] font-semibold truncate text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>{node.name}</span>
          {isDirty && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
          )}
        </span>
        {subtitle && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden md:inline">
            ({subtitle})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0" data-no-drag>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 select-none">
          <ShieldCheck className="w-3 h-3" />
          Admin
        </span>

        {isDirty && (
          <button
            onClick={() => setBody(savedBody)}
            title="Discard unsaved edits"
            className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Revert</span>
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={!isDirty && saveState !== 'saved'}
          title="Save Note (⌘S)"
          className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
            saveState === 'saved'
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : isDirty
                ? 'bg-[#007aff] hover:bg-[#0069dc] text-white shadow-blue-500/20 active:scale-95'
                : 'bg-black/5 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-default opacity-60'
          }`}
        >
          {saveState === 'saved' ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
              <span className="text-[9.5px] opacity-70 font-mono hidden sm:inline">⌘S</span>
            </>
          )}
        </button>

        <button
          onClick={lock}
          title="Lock Admin Mode"
          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Lock className="w-3 h-3" />
        </button>

        <div className="h-3.5 w-[1px] bg-black/10 dark:bg-white/10 mx-0.5" />

        <button
          onClick={() => setFontFamily((f) => (f === 'mono' ? 'sans' : 'mono'))}
          title={fontFamily === 'mono' ? 'Switch to Sans font' : 'Switch to Monospace font'}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleCopy}
          title={copied ? 'Copied to clipboard!' : 'Copy Note'}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>

        <button
          onClick={handleDownload}
          title="Download text file"
          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Download className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  return (
    <OSWindow {...chrome(props)} title={node.name} subtitle={subtitle} toolbar={editorToolbar}>
      <div className="h-full flex flex-col bg-[#fdfdfb] dark:bg-[#13151b] text-slate-800 dark:text-slate-100 selection:bg-[#007aff]/20 selection:text-inherit">
        <div className="flex-1 min-h-0 relative flex overflow-hidden">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDownTextarea}
            placeholder="Write your note here..."
            spellCheck={false}
            autoFocus
            className={`w-full h-full p-4 sm:p-6 bg-transparent outline-none resize-none overflow-y-auto leading-[1.8] border-none text-[12.5px] ${
              fontFamily === 'mono'
                ? 'font-mono'
                : 'font-sans text-[13.5px] leading-relaxed'
            }`}
          />
        </div>

        <div className="shrink-0 h-7 px-3.5 flex items-center justify-between border-t border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[10.5px] text-slate-500 dark:text-slate-400 select-none font-mono">
          <div className="flex items-center gap-3 truncate">
            <span>{lines.length} lines</span>
            <span>·</span>
            <span>{wordsCount} words</span>
            <span>·</span>
            <span>{charsCount} chars</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={isDirty ? 'text-amber-500 font-semibold' : 'text-emerald-500'}>
              {isDirty ? '● Unsaved edits (⌘S to save)' : '✓ Saved to IshantOS'}
            </span>
            <span className="hidden sm:inline opacity-60">
              UTF-8 Plain Text
            </span>
          </div>
        </div>
      </div>
    </OSWindow>
  );
}

export function TextWindow(props) {
  const { updateFileContent } = useFileSystem();
  const { isAdmin } = useAdminAuth();

  const node = findNode(props.win.nodeId);
  if (!node) return null;

  const subtitle = getPath(node.id).at(-2)?.name;

  // When admin is locked: 100% authentic, pristine native macOS note sheet
  if (!isAdmin) {
    return (
      <OSWindow {...chrome(props)} title={node.name} subtitle={subtitle}>
        <div className="h-full overflow-y-auto bg-[#fdfdfb] dark:bg-slate-900">
          <pre className="p-6 sm:p-8 font-mono text-[12px] sm:text-[12.5px] leading-[1.75] text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
            {node.body}
          </pre>
        </div>
      </OSWindow>
    );
  }

  // When admin is unlocked: Interactive editor with Save, Dirty indicator, ⌘S
  return <AdminTextEditor {...props} node={node} subtitle={subtitle} updateFileContent={updateFileContent} />;
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

  const email = props.contactEmail || PROFILE_INFO.email;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <OSWindow {...chrome(props)} title="New Message" subtitle={email}>
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">
        <div className="shrink-0 px-4 py-2 border-b border-black/10 dark:border-white/10 space-y-1.5">
          <Field label="To">
            <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              Ishant &lt;{email}&gt;
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
