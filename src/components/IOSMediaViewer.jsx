import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, ChevronLeft, ExternalLink, Download, Film,
  Play, Pause, Volume2, VolumeX, FileText, Music, Image as ImageIcon, Share2, Upload
} from 'lucide-react';
import {
  isYouTubeUrl, getYouTubeEmbedUrl,
  isInstagramUrl, getInstagramEmbedUrl, isYouTubeShortsUrl, isReelMedia
} from '../utils/mediaHelpers';
import { getParentId, registerCustomNode } from '../data/ishantOS';
import { readFileAsNode } from '../utils/fsStorage';

/**
 * IOSMediaViewer
 * 
 * Recreates native iOS Quick Look & Media Preview sheet.
 * Supports:
 * - YouTube, Shorts & Instagram Reels (responsive embed)
 * - MP4, WebM, MOV HTML5 video player with controls
 * - High-res images with zoom & download
 * - Audio files with playback controls & waveform styling
 * - Text & code documents
 * - PDFs and downloadable files
 */
export default function IOSMediaViewer({
  node,
  onBack,
  onClose,
  isDarkMode = false,
  isMuted = false
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [imageZoomed, setImageZoomed] = useState(false);
  const audioRef = useRef(null);

  // Check if filename or URL has image extension
  const hasImageExt = (str) => typeof str === 'string' && /\.(png|jpe?g|webp|gif|svg|bmp|avif|heic|heif)(\?.*)?$/i.test(str);

  // Build prioritized list of candidate sources for images
  const imageSources = useMemo(() => {
    if (!node) return [];
    const list = [];
    const isNonEmptyStr = (s) => typeof s === 'string' && s.trim().length > 0;
    const isDataUrl = (s) => isNonEmptyStr(s) && s.startsWith('data:image/');
    const isHttp = (s) => isNonEmptyStr(s) && (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/uploads/') || s.startsWith('/'));
    const isBlob = (s) => isNonEmptyStr(s) && s.startsWith('blob:');

    // 1. Embedded Base64 Data URLs (guaranteed to render offline and across all devices)
    if (isDataUrl(node.dataUrl)) list.push(node.dataUrl);
    if (isDataUrl(node.file) && node.file !== node.dataUrl) list.push(node.file);
    if (isDataUrl(node.fileUrl) && node.fileUrl !== node.dataUrl) list.push(node.fileUrl);

    // 2. High-res server or network URLs
    if (isHttp(node.fileUrl)) list.push(node.fileUrl);
    if (isHttp(node.file) && node.file !== node.fileUrl) list.push(node.file);
    if (isHttp(node.href) && node.href !== node.fileUrl) list.push(node.href);

    // 3. Canvas-generated JPEG Thumbnail / Preview (100% reliable base64 fallback)
    if (isDataUrl(node.thumbnailUrl)) list.push(node.thumbnailUrl);
    if (isDataUrl(node.preview) && node.preview !== node.thumbnailUrl) list.push(node.preview);
    if (isHttp(node.thumbnailUrl) && node.thumbnailUrl !== node.fileUrl) list.push(node.thumbnailUrl);
    if (isHttp(node.preview) && node.preview !== node.fileUrl) list.push(node.preview);

    // 4. Blob URLs (in case freshly uploaded in this tab session)
    if (isBlob(node.fileUrl)) list.push(node.fileUrl);
    if (isBlob(node.file) && node.file !== node.fileUrl) list.push(node.file);
    if (isBlob(node.preview)) list.push(node.preview);

    return Array.from(new Set(list.filter(Boolean)));
  }, [node]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [isReplacingImage, setIsReplacingImage] = useState(false);

  useEffect(() => {
    setImageZoomed(false);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setActiveImageIndex(0);
    setImageLoadFailed(imageSources.length === 0);
  }, [node?.id, imageSources]);

  const currentImgSrc = imageSources[activeImageIndex] || null;

  const handleImageError = () => {
    if (activeImageIndex + 1 < imageSources.length) {
      // Try next fallback candidate URL
      setActiveImageIndex((prev) => prev + 1);
    } else {
      setImageLoadFailed(true);
    }
  };

  const handleReplaceImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReplacingImage(true);
    try {
      const payload = await readFileAsNode(file);
      const parentId = getParentId(node.id) || 'home';
      const updatedNode = {
        ...node,
        ...payload,
        id: node.id,
        name: node.name || payload.name
      };
      await registerCustomNode(parentId, updatedNode);
      if (payload.dataUrl || payload.thumbnailUrl || payload.fileUrl) {
        setImageLoadFailed(false);
        setActiveImageIndex(0);
      }
    } catch (err) {
      console.error('Failed to update image:', err);
    } finally {
      setIsReplacingImage(false);
    }
  };

  const isBlobUrl = (url) => typeof url === 'string' && url.startsWith('blob:');

  const rawUrl = useMemo(() => {
    if (!node) return '';
    return node.dataUrl || node.videoUrl || node.href || node.fileUrl || (typeof node.file === 'string' ? node.file : '') || node.preview || node.thumbnailUrl || '';
  }, [node]);

  const thumbUrl = node?.thumbnailUrl || node?.preview || null;
  const resolvedUrl = (isBlobUrl(rawUrl) && thumbUrl) ? thumbUrl : rawUrl;

  const isYt = isYouTubeUrl(resolvedUrl) || node?.platform === 'youtube';
  const ytEmbed = isYt ? getYouTubeEmbedUrl(resolvedUrl) : null;
  const isIg = isInstagramUrl(resolvedUrl) || node?.platform === 'instagram';
  const igEmbed = isIg ? getInstagramEmbedUrl(resolvedUrl) : null;
  const isVideo = node?.kind === 'video' || (isYt && node?.kind !== 'link') || (isIg && node?.kind !== 'link') || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(resolvedUrl);
  const isImage = (node?.kind === 'image' || hasImageExt(node?.name) || hasImageExt(resolvedUrl) || (node?.dataUrl && typeof node.dataUrl === 'string' && node.dataUrl.startsWith('data:image/'))) && !isVideo && node?.kind !== 'pdf' && node?.kind !== 'text' && node?.kind !== 'project';
  const isAudio = node?.kind === 'audio' || (typeof resolvedUrl === 'string' && /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(resolvedUrl));
  const isPdf = node?.kind === 'pdf' || (typeof resolvedUrl === 'string' && resolvedUrl.toLowerCase().endsWith('.pdf'));
  const isText = node?.kind === 'text' || (!isVideo && !isImage && !isAudio && !isPdf && typeof node?.body === 'string');

  const externalLink = node?.href || (isYt || isIg ? resolvedUrl : null);

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  if (!node) return null;

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Video Player */}
      {isVideo && (
        <div className="space-y-3">
          {ytEmbed ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl border border-black/10 dark:border-white/10">
              <iframe
                src={ytEmbed}
                title={node.name}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : igEmbed ? (
            <div className="relative w-full max-w-[340px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-xl border border-black/10 dark:border-white/10">
              <iframe
                src={igEmbed}
                title={node.name}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-xl border border-black/10 dark:border-white/10 flex items-center justify-center">
              <video
                src={resolvedUrl}
                poster={thumbUrl}
                controls
                playsInline
                autoPlay
                className="max-h-[58vh] w-full rounded-2xl object-contain bg-black"
              />
            </div>
          )}

          {/* Video Metadata Card */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Film className="w-3 h-3" />
                {isYt ? 'YouTube Video' : isIg ? 'Instagram Reel' : 'Video Media'}
              </span>
              {node.meta?.duration && (
                <span className="text-[10px] text-slate-500 font-mono">{node.meta.duration}</span>
              )}
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{node.name}</h3>
            {node.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {node.description}
              </p>
            )}

            {externalLink && (
              <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5">
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Watch on Original Platform
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Image Viewer */}
      {isImage && (
        <div className="space-y-3">
          <div 
            onClick={() => {
              if (!imageLoadFailed && currentImgSrc) {
                setImageZoomed(!imageZoomed);
              }
            }}
            className="relative w-full rounded-2xl overflow-hidden bg-slate-900/40 p-2 shadow-xl border border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer select-none min-h-[180px]"
          >
            {imageLoadFailed || !currentImgSrc ? (
              <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-3 shadow-inner">
                  <ImageIcon className="w-7 h-7 opacity-90" />
                </div>
                <p className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                  Image Preview Unavailable
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                  The original image data was stored as a temporary session reference or missing from cache.
                </p>
                <label className="mt-4 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-transform">
                  <Upload className="w-3.5 h-3.5" /> {isReplacingImage ? 'Updating...' : 'Re-upload / Fix Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReplaceImage}
                  />
                </label>
              </div>
            ) : (
              <img
                src={currentImgSrc}
                alt={node.name}
                onError={handleImageError}
                className={`max-h-[60vh] max-w-full rounded-xl object-contain transition-all duration-300 ${
                  imageZoomed ? 'scale-125' : 'scale-100'
                }`}
              />
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Image
                </span>
                {node.meta?.size && (
                  <span className="text-[10px] text-slate-500 font-mono">{node.meta.size}</span>
                )}
              </div>
              <label className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" /> Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReplaceImage}
                />
              </label>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{node.name}</h3>
            {node.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {node.description}
              </p>
            )}

            {currentImgSrc && !imageLoadFailed && (
              <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5 flex gap-2">
                <a
                  href={currentImgSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={node.name}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Resolution
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Audio Player */}
      {isAudio && (
        <div className="space-y-3">
          <audio
            ref={audioRef}
            src={resolvedUrl}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={() => setIsPlayingAudio(false)}
          />

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/90 to-slate-900/90 text-white shadow-xl border border-white/10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner">
              <Music className="w-10 h-10 text-indigo-300 animate-pulse" />
            </div>

            <h3 className="font-bold text-base mb-1">{node.name}</h3>
            <p className="text-xs text-indigo-200 mb-5">{node.description || 'Audio Recording'}</p>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-5">
              <div 
                className="bg-indigo-400 h-full transition-all duration-150"
                style={{ width: `${audioProgress}%` }}
              />
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handleToggleAudio}
              className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              {isPlayingAudio ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Text Document Reader */}
      {isText && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3" /> Document
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              {node.name}
            </h3>
            {node.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {node.description}
              </p>
            )}
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-black/5 dark:border-white/5 select-text overflow-x-auto max-h-[55vh]">
              {node.body || 'No document content.'}
            </div>
          </div>
        </div>
      )}

      {/* 5. PDF & Downloadable File Card */}
      {(isPdf || (!isVideo && !isImage && !isAudio && !isText)) && (
        <div className="space-y-3">
          <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-black/10 dark:border-white/10 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              {isPdf ? <FileText className="w-8 h-8" /> : <Download className="w-8 h-8" />}
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              {node.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {node.description || (isPdf ? 'Official PDF Document' : 'File Document')}
            </p>

            <a
              href={node.href || resolvedUrl || (node.id === 'resume' ? '/resume.pdf' : '#')}
              target="_blank"
              rel="noopener noreferrer"
              download={node.name}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <ExternalLink className="w-4 h-4" /> Open / Download File
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
