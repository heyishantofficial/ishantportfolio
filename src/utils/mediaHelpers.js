/**
 * Media and URL helper utilities for YouTube, Instagram, and web links
 */

export function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

export function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function getYouTubeEmbedUrl(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
}

export function isYouTubeUrl(url) {
  return !!getYouTubeId(url);
}

export function isInstagramUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /instagram\.com\/(p|reel|tv|[\w.-]+)/i.test(url);
}

export function detectMediaType(url) {
  if (!url || typeof url !== 'string') return 'link';
  if (isYouTubeUrl(url)) return 'youtube';
  if (isInstagramUrl(url)) return 'instagram';
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return 'video';
  return 'link';
}
