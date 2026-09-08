import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, ExternalLink, Download, Copy, Check,
  Maximize2, Music, FileType2, Globe, Film, Image as ImageIcon
} from 'lucide-react';
import NodeIcon from './NodeIcon';
import {
  isYouTubeUrl, getYouTubeEmbedUrl,
  isInstagramUrl, getInstagramEmbedUrl, isYouTubeShortsUrl, isReelMedia
} from '../utils/mediaHelpers';
import { itemCountLabel } from '../data/ishantOS';

function getDomain(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

const HEADER_HEIGHT = 44;
const VIEWPORT_PADDING_X = 48;
const VIEWPORT_PADDING_Y = 80;

/**
 * QuickLookPanel
 * 
 * Recreates macOS Quick Look (invoked by Spacebar).
 * Dynamically sizes to the media's natural dimensions (e.g. 1080x1080 image -> 1080x1080 window)
 * clamped only by screen bounds, preserving exact aspect ratio.
 * Window smoothly morphs with spring physics when navigating across items.
 */
export default function QuickLookPanel({
  node,
  items = [],
  currentIndex = -1,
  onNavigate,
  onClose,
  onOpenNode,
  _isMuted = false
}) {
  const [naturalDimensions, setNaturalDimensions] = useState(null);
  const [isZoomedFull, setIsZoomedFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontFamily, setFontFamily] = useState('sans');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  // Reset per-item state when node changes
  useEffect(() => {
    setNaturalDimensions(null);
    setIsZoomedFull(false);
    setCopied(false);
    setIsPlayingAudio(false);
  }, [node?.id]);

  const isBlobUrl = (url) => typeof url === 'string' && url.startsWith('blob:');

  // Determine media URL if applicable with smart dead-blob fallback
  const mediaUrl = useMemo(() => {
    if (!node) return null;
    if (node.dataUrl) return node.dataUrl;

    const file = node.fileUrl || node.file;
    const thumb = node.preview || node.thumbnailUrl;

    // If file is a dead blob URL from another session, prefer persistent preview/thumbnail!
    if (isBlobUrl(file) && thumb) {
      return thumb;
    }

    return file || node.videoUrl || node.href || thumb || null;
  }, [node]);

  // Compute node kinds early so hooks and callbacks have them ready (no TDZ reference error!)
  const isLink = node?.kind === 'link';
  const rawUrl = node?.videoUrl || node?.href || (typeof node?.file === 'string' ? node.file : '') || mediaUrl || '';
  const isYt = isYouTubeUrl(rawUrl);
  const ytEmbed = isYt ? getYouTubeEmbedUrl(rawUrl) : null;
  const isIg = isInstagramUrl(rawUrl) || node?.platform === 'instagram';
  const igEmbed = isIg ? getInstagramEmbedUrl(rawUrl) : null;
  const isYtShorts = isYouTubeShortsUrl(rawUrl);
  const isReel = isIg || isYtShorts || isReelMedia(rawUrl, node);
  const isVideo = node?.kind === 'video' || (isYt && !isLink) || (isIg && !isLink);
  const isImage = (node?.kind === 'image' || ((node?.dataUrl || (typeof node?.file === 'string' && /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(node.file))) && !isLink && node?.kind !== 'pdf' && node?.kind !== 'text' && node?.kind !== 'project' && node?.kind !== 'folder' && node?.kind !== 'mail')) && !isLink;
  const isAudio = node?.kind === 'audio';
  const isText = node?.kind === 'text';
  const isProject = node?.kind === 'project';
  const isPdf = node?.kind === 'pdf';
  const isFolder = node?.kind === 'folder';

  const [activeMediaSrc, setActiveMediaSrc] = useState(mediaUrl);
  const [mediaLoadError, setMediaLoadError] = useState(false);

  useEffect(() => {
    setActiveMediaSrc(mediaUrl);
    setMediaLoadError(false);
  }, [mediaUrl, node?.id]);

  const handleMediaError = useCallback(() => {
    if (isImage) {
      const fallback = (typeof node?.preview === 'string' && !node.preview.startsWith('blob:') && node.preview) ||
                       (typeof node?.thumbnailUrl === 'string' && !node.thumbnailUrl.startsWith('blob:') && node.thumbnailUrl) ||
                       (typeof node?.dataUrl === 'string' && !node.dataUrl.startsWith('blob:') && node.dataUrl);
      if (fallback && activeMediaSrc !== fallback) {
        setActiveMediaSrc(fallback);
        return;
      }
    }
    setMediaLoadError(true);
  }, [node, activeMediaSrc, isImage]);

  // Measure natural dimensions for images
  useEffect(() => {
    const srcToMeasure = activeMediaSrc || mediaUrl;
    if (isImage && srcToMeasure) {
      const img = new Image();
      img.onload = () => {
        setNaturalDimensions({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600
        });
      };
      img.onerror = () => {
        handleMediaError();
        setNaturalDimensions({ width: 800, height: 600 });
      };
      img.src = srcToMeasure;
      if (img.complete && img.naturalWidth) {
        setNaturalDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    } else if (isPdf && (node?.preview || srcToMeasure)) {
      const img = new Image();
      img.onload = () => {
        setNaturalDimensions({
          width: img.naturalWidth || 640,
          height: img.naturalHeight || 820
        });
      };
      img.src = node?.preview || srcToMeasure;
      if (img.complete && img.naturalWidth) {
        setNaturalDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    }
  }, [isImage, isPdf, activeMediaSrc, mediaUrl, node?.preview, handleMediaError]);

  // Calculate dynamic target window dimensions based on actual media size
  const windowDimensions = useMemo(() => {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const maxW = Math.max(340, winW - VIEWPORT_PADDING_X);
    const maxH = Math.max(300, winH - VIEWPORT_PADDING_Y - HEADER_HEIGHT);

    // 1. Image: Exact real size 1:1, scaled down proportionally only if larger than screen
    if (isImage) {
      const natW = naturalDimensions?.width || 800;
      const natH = naturalDimensions?.height || 600;

      const scale = Math.min(1, maxW / natW, maxH / natH);
      const targetW = Math.max(360, Math.round(natW * scale));
      const targetH = Math.max(260, Math.round(natH * scale)) + HEADER_HEIGHT;

      return {
        width: isZoomedFull ? maxW : targetW,
        height: isZoomedFull ? maxH + HEADER_HEIGHT : targetH,
        natW,
        natH,
        scale
      };
    }

    // 2. Video / YouTube: 16:9 or video natural resolution
    if (isVideo) {
      const natW = 960;
      const natH = 540;
      const scale = Math.min(1, maxW / natW, maxH / natH);
      const targetW = Math.max(480, Math.round(natW * scale));
      const targetH = Math.round(targetW * (9 / 16)) + HEADER_HEIGHT;
      return { width: targetW, height: targetH, natW, natH, scale };
    }

    // 3. PDF / Resume: Standard portrait doc ratio
    if (isPdf) {
      const natW = naturalDimensions?.width || 680;
      const natH = naturalDimensions?.height || 880;
      const scale = Math.min(1, maxW / natW, maxH / natH);
      const targetW = Math.max(460, Math.round(natW * scale));
      const targetH = Math.round(natH * scale) + HEADER_HEIGHT;
      return { width: targetW, height: targetH, natW, natH, scale };
    }

    // 4. Case Study / Project
    if (isProject) {
      const targetW = Math.min(780, maxW);
      const targetH = Math.min(620, maxH + HEADER_HEIGHT);
      return { width: targetW, height: targetH };
    }

    // 5. Text Document
    if (isText) {
      const targetW = Math.min(640, maxW);
      const targetH = Math.min(520, maxH + HEADER_HEIGHT);
      return { width: targetW, height: targetH };
    }

    // 6. Folder
    if (isFolder) {
      const targetW = Math.min(600, maxW);
      const targetH = Math.min(480, maxH + HEADER_HEIGHT);
      return { width: targetW, height: targetH };
    }

    // 7. Audio
    if (isAudio) {
      return { width: Math.min(480, maxW), height: 320 + HEADER_HEIGHT };
    }

    // 8. Vertical Reels (Instagram Reel / YouTube Shorts / 9:16 Video)
    if (isReel) {
      const targetH = Math.min(680, maxH + HEADER_HEIGHT);
      const targetW = Math.max(340, Math.min(410, Math.round((targetH - HEADER_HEIGHT) * (9 / 16))));
      return { width: targetW, height: targetH };
    }

    // 9. Link
    if (isLink) {
      if (isYt) {
        const natW = 960;
        const natH = 540;
        const scale = Math.min(1, maxW / natW, maxH / natH);
        const targetW = Math.max(520, Math.round(natW * scale));
        const targetH = Math.round(targetW * (9 / 16)) + HEADER_HEIGHT + 72;
        return { width: targetW, height: targetH };
      }
      const targetW = Math.min(640, maxW);
      const targetH = Math.min(520, maxH + HEADER_HEIGHT);
      return { width: targetW, height: targetH };
    }

    // Default / Generic
    return { width: Math.min(540, maxW), height: 380 + HEADER_HEIGHT };
  }, [isImage, isVideo, isPdf, isProject, isText, isFolder, isAudio, isLink, isYt, isReel, isIg, naturalDimensions, isZoomedFull]);

  // App name to display in the "Open with..." pill button
  const openAppLabel = useMemo(() => {
    if (!node) return 'Open';
    switch (node.kind) {
      case 'text': return 'Open with TextEdit';
      case 'project': return 'Open Case Study';
      case 'pdf': return 'Open with Preview';
      case 'folder': return 'Open in Finder';
      case 'image': return 'Open with Preview';
      case 'video': return isYt ? 'Watch on YouTube' : isIg ? 'Watch on Instagram' : 'Open with QuickTime';
      case 'audio': return 'Play in Music';
      case 'mail': return 'Open in Mail';
      case 'link': return isIg ? 'Watch on Instagram' : isYt ? 'Watch on YouTube' : 'Open in Safari';
      default: return 'Open';
    }
  }, [node, isYt, isIg]);

  // Subtitle / metadata badge in header
  const metadataLabel = useMemo(() => {
    if (!node) return '';
    if (isImage && windowDimensions.natW && windowDimensions.natH) {
      const sizeStr = node.meta?.size ? ` · ${node.meta.size}` : '';
      return `${windowDimensions.natW} × ${windowDimensions.natH}${sizeStr}`;
    }
    if (isText) {
      const lines = (node.body || '').split('\n').length;
      const words = (node.body || '').trim().split(/\s+/).filter(Boolean).length;
      return `${lines} lines · ${words} words · Plain Text`;
    }
    if (isProject && node.project) {
      return `${node.project.category || 'Case Study'} · ${node.project.year || '2026'}`;
    }
    if (isFolder) {
      const count = typeof itemCountLabel === 'function' ? itemCountLabel(node) : 'Folder';
      return `${count} · Folder`;
    }
    if (isIg) {
      return 'Instagram Reel · Video';
    }
    if (isYtShorts) {
      return 'YouTube Shorts · 9:16 Reel';
    }
    if (isVideo) {
      return isYt ? 'YouTube Video · HD' : 'Video Clip · H.264';
    }
    if (isPdf) {
      return 'PDF Document · 1 Page';
    }
    if (isAudio) {
      return 'Audio Recording · AAC';
    }
    if (isLink) {
      const domain = getDomain(node.href);
      const tag = node.platform ? ` · ${node.platform.toUpperCase()}` : '';
      return `${domain}${tag} · Web Link`;
    }
    return node.description || 'Quick Look Preview';
  }, [node, isImage, isText, isProject, isFolder, isVideo, isPdf, isAudio, isLink, isIg, isYtShorts, isYt, windowDimensions]);

  // Copy text helper
  const handleCopyText = useCallback(() => {
    if (node?.body) {
      navigator.clipboard?.writeText(node.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [node?.body]);

  // Sibling navigation helpers
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < items.length - 1;

  const handlePrev = useCallback(() => {
    if (canGoPrev && onNavigate) {
      onNavigate(items[currentIndex - 1], currentIndex - 1);
    }
  }, [canGoPrev, onNavigate, items, currentIndex]);

  const handleNext = useCallback(() => {
    if (canGoNext && onNavigate) {
      onNavigate(items[currentIndex + 1], currentIndex + 1);
    }
  }, [canGoNext, onNavigate, items, currentIndex]);

  if (!node) return null;

  return (
    <div
      className="quick-look-modal fixed inset-0 z-[99990] flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-md select-none transition-opacity duration-150"
      tabIndex={-1}
      onClick={onClose}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          width: windowDimensions.width,
          height: windowDimensions.height
        }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 340,
          mass: 0.75
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col rounded-2xl overflow-hidden bg-[#1c1d22]/90 dark:bg-[#15161b]/95 backdrop-blur-3xl border border-white/20 dark:border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.65)] ring-1 ring-black/30 text-white select-none max-w-[96vw] max-h-[94vh]"
      >
        {/* ------------------------------------------------------------- *
         * macOS Quick Look Window Chrome / Header
         * ------------------------------------------------------------- */}
        <div
          className="h-11 shrink-0 px-3.5 flex items-center justify-between border-b border-white/10 bg-white/[0.04] backdrop-blur-md select-none z-10"
        >
          {/* Left: Traffic Lights & Sibling Navigator */}
          <div className="flex items-center gap-2 min-w-0">
            {/* macOS Traffic Dots */}
            <div className="flex items-center gap-1.5 mr-1">
              <button
                onClick={onClose}
                aria-label="Close Quick Look"
                title="Close (Space or Esc)"
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 active:brightness-90 flex items-center justify-center group"
              >
                <X className="w-2 h-2 text-black/70 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div
                title="Quick Look cannot be minimized"
                className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-40 cursor-default"
              />
              <button
                onClick={() => setIsZoomedFull(!isZoomedFull)}
                aria-label="Zoom to fit"
                title={isZoomedFull ? "Restore size" : "Zoom to fit"}
                className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 active:brightness-90 flex items-center justify-center group"
              >
                <Maximize2 className="w-1.5 h-1.5 text-black/70 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Sibling navigation arrows (Mac Quick Look style) */}
            {items.length > 1 && (
              <div className="flex items-center gap-0.5 ml-1 bg-white/10 rounded-md p-0.5">
                <button
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  aria-label="Previous item"
                  title="Previous item (←)"
                  className="w-5 h-5 rounded flex items-center justify-center enabled:hover:bg-white/20 active:scale-95 disabled:opacity-30 transition-all text-white/90"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  aria-label="Next item"
                  title="Next item (→)"
                  className="w-5 h-5 rounded flex items-center justify-center enabled:hover:bg-white/20 active:scale-95 disabled:opacity-30 transition-all text-white/90"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Center: Title & Metadata Badge */}
          <div className="flex-1 min-w-0 mx-3 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 max-w-full truncate">
              <NodeIcon node={node} size={14} />
              <span className="text-[12.5px] font-semibold text-white/95 truncate">
                {node.name}
              </span>
            </div>
            {metadataLabel && (
              <span className="text-[10px] text-white/60 font-medium tracking-tight truncate -mt-0.5">
                {metadataLabel}
              </span>
            )}
          </div>

          {/* Right: "Open with [App]" Action & Quick Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {isText && (
              <button
                onClick={handleCopyText}
                title={copied ? "Copied!" : "Copy text"}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white/90 transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}

            {isImage && (
              <div className="hidden sm:flex items-center gap-1 text-[10.5px] text-white/60 bg-white/10 px-2 py-1 rounded-lg">
                <span>{windowDimensions.natW}×{windowDimensions.natH}</span>
              </div>
            )}

            {/* "Open with..." Button */}
            <button
              onClick={() => {
                onOpenNode(node);
                onClose();
              }}
              title={`Open ${node.name} (Enter)`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11.5px] font-semibold text-white bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 shadow-sm transition-all"
            >
              <span>{openAppLabel}</span>
              <ExternalLink className="w-3 h-3 text-white/70" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- *
         * Content Body — Custom Renderers by Kind
         * ------------------------------------------------------------- */}
        <div className="flex-1 min-h-0 relative overflow-auto flex items-center justify-center bg-black/20">
          
          {/* 1. IMAGE: Natural Real Size */}
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              {mediaLoadError || !activeMediaSrc ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                    <ImageIcon className="w-8 h-8 text-white/70" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-white truncate max-w-xs">{node.name}</h4>
                    <p className="text-[12px] text-white/60 mt-1">Image preview unavailable</p>
                    {node.description && (
                      <p className="text-[11px] text-white/40 mt-0.5">{node.description}</p>
                    )}
                  </div>
                  {(node.fileUrl || node.file || activeMediaSrc) && (
                    <a
                      href={node.fileUrl || node.file || activeMediaSrc}
                      download={node.name}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#007aff] hover:bg-[#0069dc] text-white text-[12px] font-medium transition-all shadow-md active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              ) : (
                <img
                  src={activeMediaSrc}
                  alt={node.name}
                  onError={handleMediaError}
                  className="max-w-full max-h-full object-contain drop-shadow-2xl select-none"
                  style={{
                    width: isZoomedFull ? '100%' : 'auto',
                    height: isZoomedFull ? '100%' : 'auto'
                  }}
                />
              )}
            </div>
          )}

          {/* 2. VIDEO / YOUTUBE */}
          {isVideo && (
            <div className="w-full h-full flex items-center justify-center bg-black p-2 relative overflow-hidden">
              {isYt && ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  title={node.name}
                  className="w-full h-full rounded-xl border-0 aspect-video shadow-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : mediaLoadError ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  {(node.thumbnailUrl || node.preview) ? (
                    <img
                      src={node.thumbnailUrl || node.preview}
                      alt={node.name}
                      className="max-w-full max-h-full object-contain filter brightness-75 select-none"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                      <Film className="w-8 h-8 text-white/70" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm text-center">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-3">
                      <Film className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-[14px] font-semibold text-white truncate max-w-sm">{node.name}</h4>
                    <p className="text-[12px] text-white/70 mt-1 max-w-xs">
                      Video stream expired from earlier session.
                    </p>
                    {node.description && (
                      <p className="text-[11px] text-white/50 mt-0.5">{node.description}</p>
                    )}
                    {(node.fileUrl || node.file) && (
                      <a
                        href={node.fileUrl || node.file}
                        download={node.name}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#007aff] hover:bg-[#0069dc] text-white text-[12px] font-medium transition-all shadow-md active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Original</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <video
                  src={activeMediaSrc || mediaUrl}
                  poster={node.thumbnailUrl || node.preview}
                  controls
                  autoPlay
                  preload="metadata"
                  onError={handleMediaError}
                  className="w-full h-full object-contain rounded-xl shadow-2xl max-h-[82vh]"
                  style={{ minWidth: 320, minHeight: 200 }}
                />
              )}
            </div>
          )}

          {/* 3. TEXT / NOTES: macOS TextEdit Quick Look */}
          {isText && (
            <div className="w-full h-full flex flex-col bg-[#fdfdfc] dark:bg-[#17181d] text-slate-800 dark:text-slate-100 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 select-text">
                <pre className={`text-[12.5px] leading-[1.8] whitespace-pre-wrap break-words ${fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}>
                  {node.body || '(Empty document)'}
                </pre>
              </div>
              <div className="shrink-0 h-7 px-4 flex items-center justify-between border-t border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span>{(node.body || '').length} characters</span>
                  <span>·</span>
                  <span>UTF-8 Plain Text</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontFamily(f => f === 'mono' ? 'sans' : 'mono')}
                    className="hover:text-blue-500 font-sans text-[10px]"
                  >
                    {fontFamily === 'mono' ? 'Use Sans' : 'Use Mono'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. CASE STUDY / PROJECT */}
          {isProject && node.project && (
            <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-y-auto">
              {/* Hero Banner */}
              <div
                className="relative h-44 shrink-0 flex flex-col justify-end p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${node.project.accent || '#c0392b'} 0%, #161616 120%)`
                }}
              >
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                  <span>{node.project.category || 'Case Study'}</span>
                  <span>·</span>
                  <span>{node.project.year || '2026'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mt-1">
                  {node.project.title || node.name}
                </h2>
                {node.project.description && (
                  <p className="text-[12px] opacity-90 mt-1 max-w-xl line-clamp-2">
                    {node.project.description}
                  </p>
                )}
              </div>

              {/* Body Summary */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4 border-b border-black/10 dark:border-white/10 text-[11.5px]">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Role</div>
                    <div className="font-semibold mt-0.5">{node.project.role || 'Design & Engineering'}</div>
                  </div>
                  {node.project.client && (
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Client</div>
                      <div className="font-semibold mt-0.5">{node.project.client}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</div>
                    <div className="font-semibold mt-0.5 text-emerald-500">{node.project.status || 'Active'}</div>
                  </div>
                </div>

                {node.project.idea && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Concept</h4>
                    <p className="text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {node.project.idea}
                    </p>
                  </div>
                )}

                {node.project.tags && node.project.tags.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Stack & Tools</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {node.project.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[10.5px] font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom CTA */}
              <div className="mt-auto p-4 border-t border-black/10 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Press Space or Esc to close</span>
                <button
                  onClick={() => { onOpenNode(node); onClose(); }}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold text-white bg-[#007aff] hover:bg-[#0069dc] transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <span>Open Full Case Study</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 5. PDF / RESUME */}
          {isPdf && (
            <div className="w-full h-full flex flex-col bg-slate-200 dark:bg-slate-950 overflow-hidden">
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                {node.preview ? (
                  <img
                    src={node.preview}
                    alt={node.name}
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
                    <FileType2 className="w-16 h-16 text-red-500" />
                    <span className="text-[13px] font-bold">{node.name}</span>
                  </div>
                )}
              </div>
              <div className="shrink-0 h-10 px-4 flex items-center justify-between border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">PDF Document</span>
                {node.file && (
                  <a
                    href={node.file}
                    download={node.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-[#007aff] hover:bg-[#0069dc]"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 6. FOLDER: Live Child Items Preview */}
          {isFolder && (
            <div className="w-full h-full flex flex-col bg-white/95 dark:bg-slate-900/95 p-6 overflow-hidden">
              <div className="flex items-center gap-4 pb-4 border-b border-black/10 dark:border-white/10">
                <NodeIcon node={node} size={64} />
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">{node.name}</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">{node.description || 'Folder'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10.5px] font-semibold">
                    {typeof itemCountLabel === 'function' ? itemCountLabel(node) : 'Folder'}
                  </span>
                </div>
              </div>

              {/* Contained Files Preview List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Contents ({node.children?.length || 0})
                </div>
                {node.children && node.children.length > 0 ? (
                  node.children.filter(Boolean).map((child) => (
                    <div
                      key={child.id}
                      onClick={() => onOpenNode(child)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors group"
                    >
                      <NodeIcon node={child} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors truncate">
                          {child.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {child.kind === 'folder' || child.children ? (typeof itemCountLabel === 'function' ? itemCountLabel(child) : 'Folder') : (child.description && child.description !== 'Folder' ? child.description : child.kind)}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {child.kind}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-[12px]">
                    Folder is empty
                  </div>
                )}
              </div>

              <div className="shrink-0 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Click any file to open</span>
                <button
                  onClick={() => { onOpenNode(node); onClose(); }}
                  className="px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold text-white bg-[#007aff] hover:bg-[#0069dc] transition-colors"
                >
                  Open in Finder
                </button>
              </div>
            </div>
          )}

          {/* 7. AUDIO PLAYER */}
          {isAudio && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900 text-white text-center">
              <div className="relative mb-4">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-1 shadow-2xl ${isPlayingAudio ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <Music className="w-10 h-10 text-pink-400" />
                  </div>
                </div>
              </div>

              <h4 className="text-[15px] font-bold text-white">{node.name}</h4>
              <p className="text-[12px] text-slate-400 mt-1 max-w-sm">{node.description || 'Audio Track'}</p>

              {mediaUrl && (
                <div className="mt-5 w-full max-w-xs">
                  <audio
                    ref={audioRef}
                    src={mediaUrl}
                    controls
                    onPlay={() => setIsPlayingAudio(true)}
                    onPause={() => setIsPlayingAudio(false)}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* 8. WEB LINK & VIDEO LINK PREVIEW */}
          {isLink && (
            <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden select-none">
              {/* Case A: Instagram Reel Embed */}
              {isIg && igEmbed ? (
                <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden">
                  <div className="flex-1 w-full relative bg-slate-950 flex items-center justify-center overflow-hidden">
                    <iframe
                      src={igEmbed}
                      title={node.name}
                      className="w-full h-full border-0 bg-black"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      scrolling="no"
                    />
                  </div>
                  <div className="shrink-0 p-3 bg-slate-900/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-3 text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm text-white">
                        <Film className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-[12.5px] font-bold text-white truncate leading-tight">{node.name}</h4>
                        <p className="text-[10.5px] text-white/60 truncate">{node.description || 'Instagram Reel'}</p>
                      </div>
                    </div>
                    <a
                      href={node.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white text-[11px] font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
                    >
                      <span>Watch on IG</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : isYtShorts && ytEmbed ? (
                /* Case B: YouTube Shorts Embed (Vertical 9:16) */
                <div className="w-full h-full flex flex-col p-3 bg-black">
                  <div className="flex-1 w-full rounded-xl overflow-hidden bg-black shadow-2xl flex items-center justify-center border border-white/10">
                    <iframe
                      src={ytEmbed}
                      title={node.name}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="shrink-0 mt-2.5 flex items-center justify-between gap-3 text-white px-1">
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold truncate">{node.name}</h4>
                      <p className="text-[11px] text-white/60 truncate">{node.description || 'YouTube Shorts'}</p>
                    </div>
                    <a
                      href={node.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      <span>Open Shorts</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : isYt && ytEmbed ? (
                /* Case C: YouTube Landscape Video Embed */
                <div className="w-full h-full flex flex-col p-4 sm:p-5 bg-black">
                  <div className="flex-1 w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl flex items-center justify-center border border-white/10">
                    <iframe
                      src={ytEmbed}
                      title={node.name}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="shrink-0 mt-3 flex items-center justify-between gap-4 text-white">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-bold truncate">{node.name}</h4>
                      <p className="text-[11.5px] text-white/60 truncate">{node.description || 'YouTube Video'}</p>
                    </div>
                    <a
                      href={node.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      <span>Open YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                /* Case B: Rich Web Bookmark Card (GitHub, LinkedIn, Behance, Figma, Live Apps) */
                <div className="w-full h-full flex flex-col justify-between overflow-y-auto">
                  {/* Top Cover Visual or Platform Banner */}
                  <div className="w-full relative shrink-0">
                    {node.thumbnailUrl || node.preview ? (
                      <div className="w-full h-44 sm:h-52 bg-slate-950 relative overflow-hidden flex items-center justify-center group">
                        <img
                          src={node.thumbnailUrl || node.preview}
                          alt={node.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-white border border-white/15 shadow-sm">
                            <Globe className="w-3 h-3 text-blue-400" />
                            {getDomain(node.href)}
                          </span>
                          {node.platform && (
                            <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                              {node.platform}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-700 flex flex-col items-center justify-center text-white relative px-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-inner border border-white/20">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[12px] font-mono font-medium opacity-90">{getDomain(node.href)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Web Link
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {getDomain(node.href)}
                        </span>
                      </div>

                      <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white leading-snug">
                        {node.name}
                      </h3>

                      <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {node.description || 'Web project link and online documentation.'}
                      </p>
                    </div>

                    {/* Footer Controls */}
                    <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                        Press Space or Esc to dismiss · ← → to navigate
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(node.href);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copied' : 'Copy Link'}</span>
                        </button>

                        <a
                          href={node.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#007aff] hover:bg-[#0069dc] text-white text-[12px] font-semibold shadow-md transition-all active:scale-95"
                        >
                          <span>Open in Safari</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
