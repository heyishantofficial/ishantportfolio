// Real boot preloader.
//
// The old boot bar was a timer pretending to be a loader: it stepped by a random
// 6-13% every 100ms and let the user in after ~2s no matter what had actually
// arrived. Everything heavy — fonts, icons, wallpapers, video — then streamed in
// behind an already-interactive UI, which is what made the desktop assemble
// itself piece by piece in front of the visitor.
//
// This waits on the real thing instead. Every task below reports its own 0..1
// progress; the weighted sum drives the ring. When it resolves, the critical
// set is genuinely in the browser's cache and the desktop can paint in one shot.

import { fetchSiteSettings, DEFAULT_SETTINGS } from './siteSettings';

// Icons for the dock and the desktop grid. Small, but there are nine of them —
// enough to visibly stipple in one by one if they aren't waited for.
export const ICON_ASSETS = [
  '/icons/Finder.png',
  '/icons/Folder.png',
  '/icons/Photos.png',
  '/icons/Safari.png',
  '/icons/Chrome.png',
  '/icons/Notes.png',
  '/icons/Mail.png',
  '/icons/Bin.png',
  '/icons/Instagram.png',
  '/icons/YouTube.png',
  '/icons/LinkedIn.png',
  '/icons/iTunes.png'
];

// Wallpapers that can be on screen the instant the lock screen or desktop paints.
export const IMAGE_ASSETS = ['/bg-poc.jpg'];

export const VIDEO_ASSETS = ['/bg-video.mp4', '/lock-video.mp4'];

// Assets that are real but not on the critical path — a control-center preview
// thumbnail and the resume page. Warmed after unlock so they're ready by the
// time a click can reach them, without holding the boot hostage.
export const DEFERRED_ASSETS = ['/bg-photo.jpg', '/resume.jpg'];

// Relative pull of each stage on the progress ring. Videos dominate because
// decoding a first frame is genuinely the longest leg.
const WEIGHTS = {
  fonts: 1,
  settings: 1,
  icons: 2,
  images: 3,
  videos: 6
};

function decodeImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    // Resolve on error too: one missing icon must never strand a visitor on the
    // boot screen forever.
    img.onload = () => resolve(src);
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

// Streams an image so the ring can move on real bytes rather than jumping a
// whole step when the file lands. The response also populates the HTTP cache,
// so the <img> that eventually paints it is served locally.
//
// `onBytes(fraction)` is called with 0..1 as the body arrives; the returned
// promise resolves once the decoded bitmap is ready to paint.
function streamImage(src, onBytes) {
  return fetch(src)
    .then((res) => {
      if (!res.ok || !res.body) throw new Error(`bad response for ${src}`);
      const total = Number(res.headers.get('content-length')) || 0;
      if (!total) throw new Error(`no content-length for ${src}`);

      const reader = res.body.getReader();
      let received = 0;
      const pump = () =>
        reader.read().then(({ done, value }) => {
          if (done) return;
          received += value.length;
          onBytes(Math.min(1, received / total));
          return pump();
        });
      return pump();
    })
    .catch(() => {
      // No content-length, a CORS quirk, an offline blip — fall through to a
      // plain decode rather than blocking the boot on a progress nicety.
    })
    .then(() => {
      onBytes(1);
      return decodeImage(src);
    });
}

// Resolves once the browser has decoded frame 1 and can paint it. We deliberately
// do NOT wait for the full file — `loadeddata` (readyState >= 2) means the video
// element already has a picture to show, so the rest can buffer behind the lock
// screen without ever exposing a black rectangle.
function loadVideoFirstFrame(src, onProgress) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      onProgress(1);
      resolve(src);
    };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', report);
      video.removeEventListener('progress', report);
      video.removeEventListener('loadeddata', finish);
      video.removeEventListener('error', finish);
      clearTimeout(timer);
    };

    // Real intermediate progress: how much of the timeline the browser has
    // buffered so far. Held under 1 so only `loadeddata` can complete the step.
    const report = () => {
      if (settled) return;
      const { buffered, duration } = video;
      if (!buffered.length || !duration || !Number.isFinite(duration)) return;
      onProgress(Math.min(0.95, buffered.end(buffered.length - 1) / duration));
    };

    // A video that stalls (offline, blocked codec) must not trap the boot.
    const timer = setTimeout(finish, 15000);

    video.addEventListener('loadedmetadata', report);
    video.addEventListener('progress', report);
    video.addEventListener('loadeddata', finish);
    video.addEventListener('error', finish);
    video.src = src;
    video.load();
  });
}

// Runs `items` through `task`, averaging each item's own 0..1 progress so the
// ring advances continuously rather than in one lurch per finished file.
function loadAll(items, task, onProgress) {
  if (items.length === 0) {
    onProgress(1);
    return Promise.resolve();
  }
  const fractions = items.map(() => 0);
  onProgress(0);

  const report = (index) => (fraction) => {
    fractions[index] = fraction;
    onProgress(fractions.reduce((sum, f) => sum + f, 0) / items.length);
  };

  return Promise.all(
    items.map((item, index) => {
      const advance = report(index);
      return task(item, advance).then(() => advance(1));
    })
  );
}

function loadFonts() {
  // document.fonts.ready settles once every @font-face the page actually uses has
  // loaded, so the login heading never reflows from a fallback face mid-boot.
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 6000))
  ]);
}

/**
 * Loads everything the first painted screen depends on.
 *
 * @param {(percent: number) => void} onProgress called with 0..100
 * @returns {Promise<{ settings: { wallpaper: string, lockWallpaper: string } }>}
 *   resolves only once the critical set is in cache
 */
export function preloadBootAssets(onProgress) {
  const totalWeight = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
  const parts = { fonts: 0, settings: 0, icons: 0, images: 0, videos: 0 };

  const report = (key) => (fraction) => {
    parts[key] = fraction;
    const weighted = Object.keys(parts).reduce((sum, k) => {
      const fraction = Number.isFinite(parts[k]) ? parts[k] : 0;
      return sum + fraction * WEIGHTS[k];
    }, 0);
    onProgress(Math.min(100, Math.round((weighted / totalWeight) * 100)));
  };

  const fontsDone = loadFonts().then(() => report('fonts')(1));

  // Resolved before first paint so the wallpaper the admin published is the one
  // that paints — no post-boot swap in front of the visitor.
  let settings = DEFAULT_SETTINGS;
  const settingsDone = fetchSiteSettings().then((resolved) => {
    settings = resolved;
    report('settings')(1);
  });

  // Icons are tiny, so a plain decode is enough granularity for nine of them.
  const iconsDone = loadAll(ICON_ASSETS, (src) => decodeImage(src), report('icons'));
  const imagesDone = loadAll(IMAGE_ASSETS, streamImage, report('images'));
  const videosDone = loadAll(VIDEO_ASSETS, loadVideoFirstFrame, report('videos'));

  return Promise.all([fontsDone, settingsDone, iconsDone, imagesDone, videosDone])
    .then(() => {
      onProgress(100);
      return { settings };
    });
}

// Warms the non-critical assets once the desktop is up. Fire-and-forget.
export function preloadDeferredAssets() {
  DEFERRED_ASSETS.forEach(decodeImage);
}
