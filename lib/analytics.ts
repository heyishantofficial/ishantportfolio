'use client';

// PostHog loads after the page is idle, only on the real site (never on localhost),
// and only records the events below plus page views. No session recording.
type Props = Record<string, string | number | boolean | undefined>;

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? 'phc_matwft3L87aGc8NaV8y8jCrQHQ5BartBFkBBLySwbxqw';
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let client: { capture: (event: string, props?: Props) => void } | null = null;
const queue: [string, Props | undefined][] = [];

const enabled = () =>
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(window.location.hostname);

export function initAnalytics() {
  if (!enabled() || client) return;
  const start = () =>
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        person_profiles: 'identified_only',
        capture_pageview: 'history_change',
        autocapture: false,
        disable_session_recording: true,
        persistence: 'memory',
      });
      client = posthog;
      for (const [event, props] of queue.splice(0)) posthog.capture(event, props);
    });
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => void start(), { timeout: 4000 });
  else setTimeout(() => void start(), 2000);
}

export function track(event: string, props?: Props) {
  if (!enabled()) return;
  if (client) client.capture(event, props);
  else queue.push([event, props]);
}
