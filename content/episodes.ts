import episodes from './data/episodes.json';

// The journey, in your words. The text is content/data/episodes.json, which the
// CMS (/admin) edits; this file holds its types. Spelling is fixed; the wording and the jokes are yours.
// Each story paragraph keeps its line breaks.
// cameraRoll ids point at photos and clips in content/media.json, or at work ids.

export interface Role {
  company: string;
  title: string;
  period: string;
  aka?: string;
  notes: string;
}

export interface Episode {
  n: string;
  slug: string;
  title: string;
  company: string;
  period: string;
  logline: string;
  color: 'yellow' | 'mint' | 'pink' | 'sky' | 'sand';
  roles: Role[];
  story: string[];
  notes: string[];
  cameraRoll: { id: string; caption?: string }[];
  /** Shown only on the preview build, so you know what's missing. */
  todo?: string[];
}

export const EPISODES = episodes as Episode[];
