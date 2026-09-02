import React, { useState } from 'react';
import { FileText, Sparkles, Mail, Link2, Image as ImageIcon, Film, Music, File, Globe } from 'lucide-react';
import { isYouTubeUrl, getYouTubeThumbnail, isInstagramUrl } from '../utils/mediaHelpers';

function YouTubeGlyph({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="6" fill="#ff0000" />
      <polygon points="9.5,7.5 16.5,12 9.5,16.5" fill="#ffffff" />
    </svg>
  );
}

function InstagramGlyph({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.2" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="15.8" cy="8.2" r="0.9" fill="#ffffff" />
    </svg>
  );
}

/**
 * One icon renderer for every place a filesystem node is shown — Finder,
 * the desktop, Spotlight and the command palette — so a node looks the same
 * wherever the visitor runs into it.
 *
 * Folders use the real macOS folder artwork; video files and YouTube links
 * render rich 16:9 thumbnail cards just like macOS QuickLook.
 */
export default function NodeIcon({ node, size = 48, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const px = `${size}px`;

  if (node.kind === 'folder') {
    return (
      <img
        src="/icons/Folder.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: px, height: px }}
        className={`object-contain drop-shadow-md select-none pointer-events-none ${className}`}
      />
    );
  }

  const isYt = node.platform === 'youtube' || isYouTubeUrl(node.href || node.videoUrl);
  const isIg = node.platform === 'instagram' || isInstagramUrl(node.href);
  const thumbUrl = node.thumbnailUrl || (isYt ? getYouTubeThumbnail(node.href || node.videoUrl) : null) || (node.kind === 'video' || node.kind === 'image' ? node.preview : null);

  // Rich video / YouTube thumbnail card
  if (thumbUrl && !imgError && (isYt || node.kind === 'video' || node.thumbnailUrl)) {
    const isLarge = size >= 40;
    const cardWidth = isLarge ? Math.round(size * 1.32) : size;
    const cardHeight = isLarge ? Math.round(size * 0.78) : size;

    return (
      <span
        style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
        aria-hidden="true"
        className={`relative shrink-0 rounded-lg bg-black/90 border border-black/15 dark:border-white/20 shadow-md flex items-center justify-center overflow-hidden group select-none ${className}`}
      >
        <img
          src={thumbUrl}
          alt={node.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        {/* Play badge overlay */}
        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 backdrop-blur-sm flex items-center gap-1 text-white shadow-sm pointer-events-none">
          {isYt ? (
            <span className="w-2.5 h-2 rounded-[2px] bg-red-600 flex items-center justify-center">
              <span className="w-0 h-0 border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent border-l-[3.5px] border-l-white ml-0.5" />
            </span>
          ) : (
            <Film className="w-2.5 h-2.5 text-white" />
          )}
        </span>
      </span>
    );
  }

  // Uploaded standard image
  if (node.kind === 'image' && (node.preview || node.dataUrl) && !imgError) {
    return (
      <span
        style={{ width: px, height: px }}
        aria-hidden="true"
        className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex items-center justify-center overflow-hidden p-0.5 ${className}`}
      >
        <img
          src={node.preview || node.dataUrl}
          alt={node.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-[14%]"
        />
      </span>
    );
  }

  if (node.kind === 'pdf') {
    return (
      <span
        style={{ width: px, height: px }}
        aria-hidden="true"
        className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex flex-col items-center justify-center overflow-hidden ${className}`}
      >
        <FileText style={{ width: size * 0.4, height: size * 0.4 }} className="text-[#c0392b]" />
        {size > 32 && <span className="text-[7px] font-black tracking-wider text-[#c0392b] mt-0.5">PDF</span>}
      </span>
    );
  }

  // Branded glyphs
  if (isYt) {
    return (
      <span
        style={{ width: px, height: px }}
        aria-hidden="true"
        className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex items-center justify-center ${className}`}
      >
        <YouTubeGlyph size={size * 0.55} />
      </span>
    );
  }

  if (isIg) {
    return (
      <span
        style={{ width: px, height: px }}
        aria-hidden="true"
        className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex items-center justify-center ${className}`}
      >
        <InstagramGlyph size={size * 0.55} />
      </span>
    );
  }

  let Glyph = FileText;
  let tint = '#64748b';

  if (node.kind === 'project') {
    Glyph = Sparkles;
    tint = node.project?.accent || '#c0392b';
  } else if (node.kind === 'mail') {
    Glyph = Mail;
    tint = '#3b82f6';
  } else if (node.kind === 'link') {
    Glyph = Globe;
    tint = '#007aff';
  } else if (node.kind === 'image') {
    Glyph = ImageIcon;
    tint = '#8b5cf6';
  } else if (node.kind === 'video') {
    Glyph = Film;
    tint = '#ec4899';
  } else if (node.kind === 'audio') {
    Glyph = Music;
    tint = '#f59e0b';
  } else if (node.kind === 'file') {
    Glyph = File;
    tint = '#64748b';
  }

  return (
    <span
      style={{ width: px, height: px }}
      aria-hidden="true"
      className={`shrink-0 rounded-[18%] bg-white border border-black/10 shadow-sm flex items-center justify-center ${className}`}
    >
      <Glyph style={{ width: size * 0.44, height: size * 0.44, color: tint }} />
    </span>
  );
}

