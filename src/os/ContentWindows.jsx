import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Download, ExternalLink, Send, Minus, Plus, Trash2, Check,
  Save, Lock, RotateCcw, ShieldCheck, Type, Copy, FileText, Loader2, Film,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import OSWindow from './OSWindow';
import NodeIcon from './NodeIcon';
import { findNode, getPath, itemCount, itemCountLabel, PROJECT_SEQUENCE, TRASH_ITEMS } from '../data/ishantOS';
import { PROFILE_INFO } from '../data/projectsData';
import { isYouTubeUrl, getYouTubeEmbedUrl, isInstagramUrl, getInstagramEmbedUrl, isYouTubeShortsUrl } from '../utils/mediaHelpers';
import { useAdminAuth } from '../utils/useAdminAuth';
import { useFileSystem } from '../utils/useFileSystem';
import { sendContactEmail } from '../lib/emailService';

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
 * PDF Documents & Resume Viewer
 * ------------------------------------------------------------------ */

export function PdfWindow(props) {
  const node = findNode(props.win.nodeId);
  const [zoom, setZoom] = useState(1);

  const isResume = node?.id === 'resume' || (typeof node?.name === 'string' && node.name.toLowerCase() === 'resume.pdf');
  const isImagePreview = Boolean(
    node?.preview &&
    typeof node.preview === 'string' &&
    !node.preview.startsWith('data:application/pdf') &&
    !/\.pdf($|\?)/i.test(node.preview) &&
    (
      node.preview.startsWith('data:image/') ||
      /\.(jpe?g|png|webp|gif|svg|avif)($|\?)/i.test(node.preview) ||
      node.preview === '/resume.jpg'
    )
  );

  const isBlobUrl = (url) => typeof url === 'string' && url.startsWith('blob:');
  const thumbPdf = typeof node?.preview === 'string' && node.preview.startsWith('data:application/pdf') ? node.preview : null;
  const rawPdfUrl =
    (node?.dataUrl && node.dataUrl.startsWith('data:application/pdf') ? node.dataUrl : null) ||
    (isBlobUrl(node?.file) && node?.dataUrl ? node.dataUrl : null) ||
    node?.fileUrl ||
    node?.file ||
    thumbPdf ||
    node?.href ||
    (isResume ? '/resume.pdf' : null);

  const [viewMode, setViewMode] = useState(isImagePreview ? 'image' : 'pdf');
  const [displayUrl, setDisplayUrl] = useState(null);

  useEffect(() => {
    let activeBlobUrl = null;
    if (typeof rawPdfUrl === 'string' && rawPdfUrl.startsWith('data:application/pdf')) {
      try {
        const parts = rawPdfUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mime });
        activeBlobUrl = URL.createObjectURL(blob);
        setDisplayUrl(activeBlobUrl);
      } catch (err) {
        console.error('Failed to convert PDF data URL to blob:', err);
        setDisplayUrl(rawPdfUrl);
      }
    } else {
      setDisplayUrl(rawPdfUrl);
    }

    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [rawPdfUrl]);

  const handleDownload = useCallback(() => {
    const url = displayUrl || rawPdfUrl || (isResume ? '/resume.pdf' : null);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    const docName = node?.name || (isResume ? 'Ishant_Chauhan_Resume.pdf' : 'document.pdf');
    a.download = docName.toLowerCase().endsWith('.pdf') ? docName : `${docName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [displayUrl, rawPdfUrl, isResume, node?.name]);

  const handleOpenExternally = useCallback(() => {
    const url = displayUrl || rawPdfUrl || (isResume ? '/resume.pdf' : null);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [displayUrl, rawPdfUrl, isResume]);

  if (!node) return null;

  const windowSubtitle = isResume ? PROFILE_INFO.name : (node.description || 'PDF Document');

  return (
    <OSWindow {...chrome(props)} title={node.name} subtitle={windowSubtitle}>
      <div className="h-full flex flex-col bg-slate-200 dark:bg-slate-950">
        <div className="shrink-0 h-9 px-3 flex items-center gap-2 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70">
          {viewMode === 'image' && isImagePreview ? (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
                aria-label="Zoom out"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono w-10 text-center text-slate-500">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
                aria-label="Zoom in"
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-2 py-0.5 rounded text-[10px] font-medium hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 cursor-pointer"
              >
                100%
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400">
                PDF
              </span>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[320px]">
                {node.name}
              </span>
            </div>
          )}

          {isImagePreview && rawPdfUrl && (
            <button
              onClick={() => setViewMode((m) => (m === 'image' ? 'pdf' : 'image'))}
              className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 transition-colors cursor-pointer"
            >
              {viewMode === 'image' ? 'Interactive PDF' : 'Image View'}
            </button>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={handleOpenExternally}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" /> Open externally
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-[var(--os-accent)] hover:brightness-110 cursor-pointer"
            >
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-100 dark:bg-slate-900">
          {viewMode === 'image' && isImagePreview ? (
            <div className="flex-1 overflow-auto p-4 flex justify-center">
              <img
                src={node.preview}
                alt={isResume ? `${PROFILE_INFO.name} resume` : (node.name || 'PDF Document')}
                style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
                className="h-fit shadow-2xl bg-white rounded-sm"
              />
            </div>
          ) : displayUrl ? (
            <iframe
              src={displayUrl}
              title={node.name || 'PDF Document'}
              className="w-full h-full border-0 bg-white dark:bg-slate-900"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <FileText className="w-14 h-14 text-red-500 mb-3" />
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">{node.name}</p>
              <p className="text-xs text-slate-500 mb-4">{node.description || 'PDF Document'}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          )}
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
  const [mediaError, setMediaError] = useState(false);

  const thumbUrl = node?.thumbnailUrl || node?.preview;
  const isBlobUrl = (url) => typeof url === 'string' && url.startsWith('blob:');
  const rawFileUrl = node?.dataUrl || node?.fileUrl || node?.file || node?.videoUrl || node?.href || thumbUrl;
  const resolvedUrl = (isBlobUrl(rawFileUrl) && thumbUrl) ? thumbUrl : rawFileUrl;
  const isDataUrl = typeof resolvedUrl === 'string' && resolvedUrl.startsWith('data:');
  const [activeFileUrl, setActiveFileUrl] = useState(resolvedUrl);
  const [isMediaLoaded, setIsMediaLoaded] = useState(isDataUrl);

  useEffect(() => {
    setActiveFileUrl(resolvedUrl);
    setMediaError(false);
    setIsMediaLoaded(typeof resolvedUrl === 'string' && resolvedUrl.startsWith('data:'));
  }, [resolvedUrl, node?.id]);

  if (!node) return null;

  const handleImgError = () => {
    if (thumbUrl && activeFileUrl !== thumbUrl) {
      setActiveFileUrl(thumbUrl);
    } else {
      setMediaError(true);
    }
  };

  const fileUrl = activeFileUrl;
  const isImage = node.kind === 'image';
  const isYt = isYouTubeUrl(node.videoUrl || node.href || fileUrl);
  const ytEmbed = isYt ? getYouTubeEmbedUrl(node.videoUrl || node.href || fileUrl) : null;
  const isIg = isInstagramUrl(node.videoUrl || node.href || fileUrl);
  const igEmbed = isIg ? getInstagramEmbedUrl(node.videoUrl || node.href || fileUrl) : null;
  const isYtShorts = isYouTubeShortsUrl(node.videoUrl || node.href || fileUrl);
  const isVideo = node.kind === 'video' || isYt || isIg;
  const isAudio = node.kind === 'audio';
  const externalLink = node.href || (isYt || isIg ? (node.href || fileUrl) : null);

  return (
    <OSWindow {...chrome(props)} title={node.name} subtitle={node.description || (isIg ? 'Instagram Reel' : isYt ? 'YouTube Video' : 'Media Preview')}>
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
                <ExternalLink className="w-3 h-3" /> {isIg ? 'Watch on Instagram' : isYt ? 'Watch on YouTube' : 'Open in Browser'}
              </a>
            )}
            {(node.fileUrl || node.file || fileUrl) && !isYt && !isIg && !externalLink && (
              <a
                href={node.dataUrl || node.fileUrl || node.file || fileUrl}
                download={node.name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-[var(--os-accent)] hover:brightness-110"
              >
                <Download className="w-3 h-3" /> Download
              </a>
            )}
          </div>
        </div>

        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center min-h-[260px]">
          {isImage ? (
            <>
              {!isMediaLoaded && !mediaError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 z-10 bg-slate-100/60 dark:bg-slate-950/60 backdrop-blur-[2px]">
                  <Loader2 className="w-6 h-6 text-[#007aff] animate-spin" />
                  <span className="text-[11px] font-medium text-slate-500">Loading full image...</span>
                </div>
              )}
              {mediaError ? (
                <div className="flex flex-col items-center justify-center gap-2 text-center p-6">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Could not preview image.</p>
                  {(node.dataUrl || node.fileUrl || node.file || fileUrl) && (
                    <a
                      href={node.dataUrl || node.fileUrl || node.file || fileUrl}
                      download={node.name}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-[#007aff]"
                    >
                      <Download className="w-3.5 h-3.5" /> Download File
                    </a>
                  )}
                </div>
              ) : (
                <img
                  src={activeFileUrl}
                  alt={node.name}
                  onLoad={() => setIsMediaLoaded(true)}
                  onError={handleImgError}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out, opacity 0.25s ease'
                  }}
                  className={`max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-md bg-transparent select-none ${
                    isMediaLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </>
          ) : isVideo ? (
            isIg && igEmbed ? (
              <div className="w-full h-full p-2 sm:p-4 flex items-center justify-center">
                <div className="h-full max-h-[85vh] aspect-[9/16] rounded-xl overflow-hidden shadow-2xl bg-black border border-black/20">
                  <iframe
                    src={igEmbed}
                    title={node.name}
                    className="w-full h-full border-0 bg-black"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    scrolling="no"
                  />
                </div>
              </div>
            ) : ytEmbed ? (
              <div className="w-full h-full p-2 sm:p-4 flex items-center justify-center">
                <div className={`w-full ${isYtShorts ? 'max-w-xs aspect-[9/16]' : 'max-w-4xl aspect-video'} rounded-xl overflow-hidden shadow-2xl bg-black border border-black/20`}>
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
              <div className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center">
                {mediaError ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-sm">
                    {thumbUrl ? (
                      <div className="relative rounded-xl overflow-hidden shadow-2xl">
                        <img src={thumbUrl} alt={node.name} className="max-h-[60vh] max-w-[80vw] object-contain filter brightness-75 select-none" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/50 backdrop-blur-sm text-white">
                          <Film className="w-8 h-8 mb-2 opacity-80" />
                          <p className="text-[12.5px] font-medium">Video stream unavailable</p>
                          <p className="text-[10.5px] text-white/60 mt-0.5">Stream expired from earlier session</p>
                          {(node.fileUrl || node.file) && (
                            <a
                              href={node.fileUrl || node.file}
                              download={node.name}
                              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-[#007aff] hover:bg-[#0069dc]"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Original Video
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-6">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Could not load video.</p>
                        {(node.fileUrl || node.file) && (
                          <a
                            href={node.fileUrl || node.file}
                            download={node.name}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-[#007aff]"
                          >
                            <Download className="w-3.5 h-3.5" /> Download File
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {!isMediaLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 z-10 bg-black/40 backdrop-blur-sm rounded-lg pointer-events-none">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                        <span className="text-[11px] font-medium text-white/80">Buffering video...</span>
                      </div>
                    )}
                    <video
                      src={fileUrl}
                      poster={thumbUrl}
                      controls
                      autoPlay
                      preload="metadata"
                      onLoadedData={() => setIsMediaLoaded(true)}
                      onWaiting={() => setIsMediaLoaded(false)}
                      onPlaying={() => setIsMediaLoaded(true)}
                      onError={() => setMediaError(true)}
                      className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl bg-black"
                    />
                  </>
                )}
              </div>
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
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState("Let's work together");
  const [body, setBody] = useState('Hi Ishant,\n\nI found your portfolio and wanted to reach out regarding...');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const email = props.contactEmail || PROFILE_INFO.email;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSending) return;
    setError(null);
    setIsSending(true);

    try {
      await sendContactEmail({
        name,
        email: senderEmail,
        subject,
        message: body
      });
      setSent(true);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch {}
    } catch (err) {
      setError(err.message || 'Failed to deliver message. Please check your internet or email directly.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setName('');
    setSenderEmail('');
    setSubject("Let's work together");
    setBody('Hi Ishant,\n\nI found your portfolio and wanted to reach out regarding...');
    setError(null);
    setSent(false);
  };

  return (
    <OSWindow {...chrome(props)} title="New Message" subtitle={email}>
      <div className="h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Message Delivered Successfully!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Thank you {name ? <span className="font-semibold">{name}</span> : ''}! Your email has been delivered straight to Ishant's Gmail.
              </p>
              {senderEmail && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Ishant will reply directly to <span className="font-mono text-slate-700 dark:text-slate-300">{senderEmail}</span>.
                </p>
              )}
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
              {props.onClose && (
                <button
                  type="button"
                  onClick={() => props.onClose(props.win.id)}
                  className="px-4 py-2 bg-[var(--os-accent)] text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 px-4 py-2.5 border-b border-black/10 dark:border-white/10 space-y-2">
              <Field label="To">
                <div className="flex items-center justify-between text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                  <span>Ishant &lt;{email}&gt;</span>
                  <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Direct Inbox
                  </span>
                </div>
              </Field>

              <Field label="From">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name (e.g. John Doe)"
                    disabled={isSending}
                    className="w-full bg-transparent text-[12px] font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none border-b border-transparent focus:border-[var(--os-accent)] py-0.5 transition-colors"
                  />
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="Your Email (e.g. john@example.com)"
                    disabled={isSending}
                    className="w-full bg-transparent text-[12px] font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none border-b border-transparent focus:border-[var(--os-accent)] py-0.5 transition-colors"
                  />
                </div>
              </Field>

              <Field label="Subject">
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-label="Subject"
                  placeholder="Subject of your message"
                  disabled={isSending}
                  className="w-full bg-transparent text-[12px] font-semibold text-slate-800 dark:text-slate-100 outline-none border-b border-transparent focus:border-[var(--os-accent)] py-0.5 transition-colors"
                />
              </Field>
            </div>

            {error && (
              <div className="mx-4 mt-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="Message"
              placeholder="Write your message here..."
              disabled={isSending}
              className="flex-1 w-full p-4 bg-transparent resize-none outline-none text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />

            <div className="shrink-0 px-4 py-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--os-accent)] text-white text-[11px] font-bold hover:brightness-110 active:scale-95 disabled:opacity-60 transition-all cursor-pointer shadow-sm"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Delivers straight to Ishant's Gmail</span>
              </div>

              <a
                href={mailto}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline transition-colors"
                title="Open in your computer's default mail client"
              >
                Open in mail app ↗
              </a>
            </div>
          </>
        )}
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
