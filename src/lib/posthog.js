import posthog from 'posthog-js';

// Default to user's PostHog US Cloud project if not overridden in env
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_matwft3L87aGc8NaV8y8jCrQHQ5BartBFkBBLySwbxqw';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let isInitialized = false;

// Local in-memory session tracker for instant dashboard updates
export const localSessionMetrics = {
  sessionStartTime: Date.now(),
  appsLaunchedInSession: {},
  projectsViewedInSession: new Set(),
  actionsInSession: 0
};

/**
 * Initialize PostHog client with privacy masking and session replay
 */
export function initPostHog() {
  if (typeof window === 'undefined' || isInitialized) return posthog;

  try {
    if (POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        autocapture: true,
        capture_pageview: true,
        session_recording: {
          maskAllInputs: true,
          maskInputOptions: {
            password: true,
            color: false,
            date: false
          }
        },
        loaded: (ph) => {
          if (import.meta.env.DEV) {
            // Keep console uncluttered in dev
            ph.debug(false);
          }
        }
      });
      isInitialized = true;
    }
  } catch (err) {
    console.warn('[PostHog] Init notice:', err.message);
  }

  // Record initial session start in local beacon
  beaconEvent('session_start', 'Initial Visit', getActivePlatform());

  return posthog;
}

function getActivePlatform() {
  if (typeof window === 'undefined') return 'macos';
  return window.innerWidth < 768 ? 'ios' : 'macos';
}

/**
 * Internal helper to send lightweight beacon to server /api/analytics/event
 */
async function beaconEvent(event, name = 'unknown', platform = null, meta = {}) {
  const effPlatform = platform || getActivePlatform();
  try {
    const payload = JSON.stringify({
      event,
      name,
      platform: effPlatform,
      meta
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/event', blob);
    } else {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Core event tracking method
 */
export function trackEvent(eventName, properties = {}) {
  localSessionMetrics.actionsInSession += 1;

  // 1. PostHog track
  try {
    if (typeof window !== 'undefined' && isInitialized) {
      posthog.capture(eventName, properties);
    }
  } catch (e) {
    console.debug('[PostHog Error]', e);
  }

  // 2. Server beacon track
  beaconEvent(
    properties.beaconEvent || 'custom_event',
    properties.name || eventName,
    properties.platform,
    properties
  );
}

/**
 * Track an App launch (Finder, Safari, Retro Arcade, Cyberdeck, etc.)
 */
export function trackAppLaunch(appId, platform = null) {
  const effPlatform = platform || getActivePlatform();
  localSessionMetrics.appsLaunchedInSession[appId] = (localSessionMetrics.appsLaunchedInSession[appId] || 0) + 1;
  localSessionMetrics.actionsInSession += 1;

  try {
    if (typeof window !== 'undefined' && isInitialized) {
      posthog.capture('app_launched', {
        app_id: appId,
        platform: effPlatform
      });
    }
  } catch {}

  beaconEvent('app_launch', appId, effPlatform);
}

/**
 * Track a Project Modal / Safari preview view
 */
export function trackProjectView(projectName, source = 'desktop') {
  localSessionMetrics.projectsViewedInSession.add(projectName);
  localSessionMetrics.actionsInSession += 1;

  try {
    if (typeof window !== 'undefined' && isInitialized) {
      posthog.capture('project_viewed', {
        project_name: projectName,
        source
      });
    }
  } catch {}

  beaconEvent('project_view', projectName, getActivePlatform(), { source });
}

/**
 * Track resume / CV view
 */
export function trackResumeView(source = 'dock') {
  localSessionMetrics.actionsInSession += 1;

  try {
    if (typeof window !== 'undefined' && isInitialized) {
      posthog.capture('resume_viewed', { source });
    }
  } catch {}

  beaconEvent('resume_view', 'Resume PDF', getActivePlatform(), { source });
}

/**
 * Track copy email or contact action
 */
export function trackEmailCopy(source = 'general') {
  localSessionMetrics.actionsInSession += 1;

  try {
    if (typeof window !== 'undefined' && isInitialized) {
      posthog.capture('email_copied', { source });
    }
  } catch {}

  beaconEvent('email_copy', 'Contact Email', getActivePlatform(), { source });
}

/**
 * Track clicking outbound social links
 */
export function trackSocialClick(network, url) {
  localSessionMetrics.actionsInSession += 1;

  try {
    if (typeof window !== 'undefined' && isInitialized) {
      posthog.capture('social_link_clicked', { network, url });
    }
  } catch {}

  beaconEvent('social_click', network, getActivePlatform(), { url });
}

/**
 * Fetch analytics data from backend for System Settings
 */
export async function fetchAnalyticsSummary() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data = await res.json();
    return data.analytics;
  } catch (err) {
    console.warn('[Analytics] Fetch error:', err.message);
    return null;
  }
}

/**
 * Reset analytics data (admin only)
 */
export async function resetAnalyticsData(password) {
  try {
    const res = await fetch('/api/analytics/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default posthog;
