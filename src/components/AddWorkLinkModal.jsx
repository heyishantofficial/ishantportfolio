import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Link2, Film, Globe, Sparkles, AlertCircle, Play, Check, ExternalLink, MonitorPlay
} from 'lucide-react';
import { getYouTubeThumbnail, detectMediaType, isYouTubeUrl, isInstagramUrl } from '../utils/mediaHelpers';

export default function AddWorkLinkModal({ isOpen, onClose, folderNode, onAddLink }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [customThumbnail, setCustomThumbnail] = useState('');
  const [openMode, setOpenMode] = useState('embed'); // 'embed' or 'tab'
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef(null);

  // Auto-detect platform and preview thumbnail as user enters URL
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setTitle('');
      setDescription('');
      setPlatform('youtube');
      setCustomThumbnail('');
      setOpenMode('embed');
      setError('');
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    if (error) setError('');

    const detected = detectMediaType(newUrl);
    setPlatform(detected);

    if (detected === 'youtube' || detected === 'video') {
      setOpenMode('embed');
    } else {
      setOpenMode('tab');
    }

    // If title is empty, try to auto-generate a nice friendly title
    if (!title) {
      if (detected === 'youtube') {
        setTitle('YouTube Video');
      } else if (detected === 'instagram') {
        setTitle('Instagram Reel');
      }
    }
  };

  const previewThumbnail = useMemo(() => {
    if (customThumbnail.trim()) return customThumbnail.trim();
    if (platform === 'youtube' || isYouTubeUrl(url)) {
      return getYouTubeThumbnail(url);
    }
    return null;
  }, [url, customThumbnail, platform]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!url.trim()) {
      setError('Please provide a URL.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title for this item.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddLink?.({
        name: title.trim(),
        href: url.trim(),
        description: description.trim() || (platform === 'youtube' ? 'YouTube Video' : 'Web Link'),
        platform,
        thumbnailUrl: previewThumbnail || '',
        openMode
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-2xl bg-white/95 dark:bg-[#1c1c22]/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                  Add Work Link or Video
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Adding to <span className="font-semibold text-[#007aff]">{folderNode?.name || 'Folder'}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-[12.5px]">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* URL Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Video or Work URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://instagram.com/reel/..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.07] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all text-xs font-mono"
                />
              </div>
            </div>

            {/* Platform Selector Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Platform / Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setPlatform('youtube'); setOpenMode('embed'); }}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    platform === 'youtube'
                      ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-bold shadow-sm'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </span>
                  <span className="text-[10px]">YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatform('instagram')}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    platform === 'instagram'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold shadow-sm'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center text-[10px]">
                    <Film className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[10px]">Instagram</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPlatform('video'); setOpenMode('embed'); }}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    platform === 'video'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shadow-sm'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                    <Film className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[10px]">Video Reel</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPlatform('link'); setOpenMode('tab'); }}
                  className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    platform === 'link'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <Globe className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[10px]">Web Link</span>
                </button>
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Title / Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fintech Breakdown or Viral Hook Strategy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.07] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all text-xs"
              />
            </div>

            {/* Proof / Metrics / Description Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Work Proof & Metrics <span className="font-normal opacity-70">(Optional Subtitle)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 1.2M views · Produced & scripted · 84% retention"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.07] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all text-xs"
              />
            </div>

            {/* Live Thumbnail Preview Card */}
            {previewThumbnail ? (
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center gap-3">
                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 shadow-md border border-black/20">
                  <img
                    src={previewThumbnail}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={() => setCustomThumbnail('')}
                  />
                  {platform === 'youtube' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-6 h-4 rounded-md bg-red-600 flex items-center justify-center text-white shadow-sm">
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Live Thumbnail Detected
                  </span>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate mt-0.5">
                    {title || 'Untitled Asset'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                    {description || (platform === 'youtube' ? 'YouTube Video' : 'Web Link')}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Custom Cover Image URL <span className="font-normal opacity-70">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={customThumbnail}
                  onChange={(e) => setCustomThumbnail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.07] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all text-xs font-mono"
                />
              </div>
            )}

            {/* Playback behavior */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Visitor Interaction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOpenMode('embed')}
                  className={`px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    openMode === 'embed'
                      ? 'border-[#007aff] bg-[#007aff]/10 text-[#007aff] font-semibold'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <MonitorPlay className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[11.5px] font-bold">Watch on Desktop</div>
                    <div className="text-[10px] opacity-75">Plays in Mac video window</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOpenMode('tab')}
                  className={`px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    openMode === 'tab'
                      ? 'border-[#007aff] bg-[#007aff]/10 text-[#007aff] font-semibold'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[11.5px] font-bold">Open External Link</div>
                    <div className="text-[10px] opacity-75">Opens in new browser tab</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#007aff] hover:bg-[#0069dc] text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? 'Adding...' : 'Add to Folder'}
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
