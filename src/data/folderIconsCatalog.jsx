import React from 'react';
import { 
  Code, Briefcase, Sparkles, Film, Music, Camera, Gamepad2, Compass, 
  Star, Rocket, ShieldCheck, Coffee, Heart, Zap, Globe, User 
} from 'lucide-react';

export const FOLDER_COLOR_PRESETS = [
  { id: 'default', name: 'macOS Aqua Blue', type: 'color', filter: '', swatch: '#38a8e8' },
  { id: 'color-indigo', name: 'Ocean Indigo', type: 'color', filter: 'hue-rotate(20deg) saturate(1.3)', swatch: '#4f46e5' },
  { id: 'color-purple', name: 'Royal Purple', type: 'color', filter: 'hue-rotate(50deg) saturate(1.3)', swatch: '#9333ea' },
  { id: 'color-pink', name: 'Rose Pink', type: 'color', filter: 'hue-rotate(110deg) saturate(1.3)', swatch: '#ec4899' },
  { id: 'color-red', name: 'Ruby Crimson', type: 'color', filter: 'hue-rotate(145deg) saturate(1.4)', swatch: '#e11d48' },
  { id: 'color-orange', name: 'Sunset Amber', type: 'color', filter: 'hue-rotate(170deg) saturate(1.5)', swatch: '#f97316' },
  { id: 'color-gold', name: 'California Gold', type: 'color', filter: 'hue-rotate(190deg) saturate(1.6) brightness(1.1)', swatch: '#eab308' },
  { id: 'color-green', name: 'Emerald Forest', type: 'color', filter: 'hue-rotate(240deg) saturate(1.2)', swatch: '#10b981' },
  { id: 'color-teal', name: 'Sequoia Mint', type: 'color', filter: 'hue-rotate(295deg) saturate(1.15)', swatch: '#14b8a6' },
  { id: 'color-graphite', name: 'Graphite Slate', type: 'color', filter: 'grayscale(1) brightness(0.9)', swatch: '#64748b' },
  { id: 'color-midnight', name: 'Dark Obsidian', type: 'color', filter: 'grayscale(1) brightness(0.65) contrast(1.2)', swatch: '#1e293b' },
];

export const BADGE_ICONS = {
  Code,
  Briefcase,
  Sparkles,
  Film,
  Music,
  Camera,
  Gamepad2,
  Compass,
  Star,
  Rocket,
  ShieldCheck,
  Coffee,
  Heart,
  Zap,
  Globe,
  User
};

export const FOLDER_BADGE_PRESETS = [
  { id: 'badge-code', name: 'Code & Dev', iconName: 'Code', filter: 'hue-rotate(20deg)', tag: 'Developer' },
  { id: 'badge-briefcase', name: 'Work / Portfolio', iconName: 'Briefcase', filter: '', tag: 'Projects' },
  { id: 'badge-sparkles', name: 'AI & Vibecoding', iconName: 'Sparkles', filter: 'hue-rotate(50deg)', tag: 'AI Lab' },
  { id: 'badge-film', name: 'Video & Cinema', iconName: 'Film', filter: 'hue-rotate(145deg)', tag: 'Media' },
  { id: 'badge-music', name: 'Audio & Music', iconName: 'Music', filter: 'hue-rotate(110deg)', tag: 'Music' },
  { id: 'badge-camera', name: 'Photography', iconName: 'Camera', filter: 'hue-rotate(295deg)', tag: 'Photos' },
  { id: 'badge-gamepad', name: 'Retro Gaming', iconName: 'Gamepad2', filter: 'hue-rotate(170deg)', tag: 'Games' },
  { id: 'badge-compass', name: 'Journey & Story', iconName: 'Compass', filter: 'hue-rotate(240deg)', tag: 'Career' },
  { id: 'badge-star', name: 'Featured Works', iconName: 'Star', filter: 'hue-rotate(190deg)', tag: 'Top Picks' },
  { id: 'badge-rocket', name: 'Startups & Launch', iconName: 'Rocket', filter: 'hue-rotate(145deg)', tag: 'Apps' },
  { id: 'badge-shield', name: 'Vault & Security', iconName: 'ShieldCheck', filter: 'grayscale(1) brightness(0.8)', tag: 'Secure' },
  { id: 'badge-coffee', name: 'Casual & Thoughts', iconName: 'Coffee', filter: 'hue-rotate(170deg)', tag: 'Random' },
  { id: 'badge-heart', name: 'Personal Favorites', iconName: 'Heart', filter: 'hue-rotate(120deg)', tag: 'Personal' },
  { id: 'badge-zap', name: 'Lightning Speed', iconName: 'Zap', filter: 'hue-rotate(190deg)', tag: 'Fast' },
  { id: 'badge-globe', name: 'Web & Systems', iconName: 'Globe', filter: 'hue-rotate(295deg)', tag: 'Network' },
  { id: 'badge-user', name: 'About & Bio', iconName: 'User', filter: 'hue-rotate(20deg)', tag: 'Identity' },
];

export const FOLDER_SYSTEM_APP_PRESETS = [
  { id: 'app-terminal', name: 'Terminal', src: '/icons/Terminal.png' },
  { id: 'app-safari', name: 'Safari', src: '/icons/Safari.png' },
  { id: 'app-notes', name: 'Notes', src: '/icons/Notes.png' },
  { id: 'app-photos', name: 'Photos', src: '/icons/Photos.png' },
  { id: 'app-itunes', name: 'iPod / Music', src: '/icons/iTunes.png' },
  { id: 'app-finder', name: 'Finder', src: '/icons/Finder.png' },
  { id: 'app-mail', name: 'Mail', src: '/icons/Mail.png' },
  { id: 'app-chrome', name: 'Chrome', src: '/icons/Chrome.png' },
  { id: 'app-youtube', name: 'YouTube', src: '/icons/YouTube.png' },
  { id: 'app-instagram', name: 'Instagram', src: '/icons/Instagram.png' },
  { id: 'app-linkedin', name: 'LinkedIn', src: '/icons/LinkedIn.png' },
  { id: 'app-bin', name: 'Trash Bin', src: '/icons/Bin.png' },
];

export function findPresetById(id) {
  if (!id || id === 'default') return FOLDER_COLOR_PRESETS[0];
  return (
    FOLDER_COLOR_PRESETS.find((p) => p.id === id) ||
    FOLDER_BADGE_PRESETS.find((p) => p.id === id) ||
    FOLDER_SYSTEM_APP_PRESETS.find((p) => p.id === id) ||
    null
  );
}

/**
 * Universal folder artwork renderer.
 * Renders standard folder, tinted folder, badged macOS folder, system app icon, or custom image URL.
 */
export function FolderArtwork({ iconKey, size = 48, className = '', alt = '' }) {
  const px = `${size}px`;

  // 1. Direct URL (Uploads, external URLs, data URLs)
  if (typeof iconKey === 'string' && (iconKey.startsWith('/') || iconKey.startsWith('http') || iconKey.startsWith('data:'))) {
    // If it's a direct image file or uploaded path
    return (
      <img
        src={iconKey}
        alt={alt}
        aria-hidden="true"
        draggable={false}
        style={{ width: px, height: px }}
        className={`object-contain drop-shadow-md select-none pointer-events-none ${className}`}
      />
    );
  }

  // 2. Lookup Preset
  const preset = findPresetById(iconKey);

  // App preset (e.g. app-safari)
  if (preset && preset.src) {
    return (
      <img
        src={preset.src}
        alt={alt || preset.name}
        aria-hidden="true"
        draggable={false}
        style={{ width: px, height: px }}
        className={`object-contain drop-shadow-md select-none pointer-events-none ${className}`}
      />
    );
  }

  // Badge preset (e.g. badge-code)
  if (preset && preset.iconName) {
    const Glyph = BADGE_ICONS[preset.iconName] || Sparkles;
    const badgeSize = Math.max(10, Math.round(size * 0.36));

    return (
      <span
        style={{ width: px, height: px }}
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      >
        <img
          src="/icons/Folder.png"
          alt={alt}
          aria-hidden="true"
          draggable={false}
          style={{ width: px, height: px, filter: preset.filter || undefined }}
          className="w-full h-full object-contain drop-shadow-md select-none pointer-events-none"
        />
        {/* Embossed centered glyph on folder face */}
        <span
          style={{
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${badgeSize}px`,
            height: `${badgeSize}px`
          }}
          className="absolute flex items-center justify-center pointer-events-none text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        >
          <Glyph style={{ width: '100%', height: '100%' }} strokeWidth={2.3} />
        </span>
      </span>
    );
  }

  // Color preset (e.g. color-purple)
  if (preset && preset.filter) {
    return (
      <img
        src="/icons/Folder.png"
        alt={alt}
        aria-hidden="true"
        draggable={false}
        style={{ width: px, height: px, filter: preset.filter }}
        className={`object-contain drop-shadow-md select-none pointer-events-none ${className}`}
      />
    );
  }

  // Fallback / default macOS folder
  return (
    <img
      src="/icons/Folder.png"
      alt={alt}
      aria-hidden="true"
      draggable={false}
      style={{ width: px, height: px }}
      className={`object-contain drop-shadow-md select-none pointer-events-none ${className}`}
    />
  );
}
