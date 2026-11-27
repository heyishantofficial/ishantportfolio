// Who you are, how to reach you, and the small lists the home page and the
// playground use. The text is content/data/site.json, which the CMS (/admin)
// edits; this file holds its types.

import site from './data/site.json';

export type StickerColor = 'yellow' | 'mint' | 'pink' | 'sky' | 'sand' | 'blush' | 'blue' | 'green' | 'orange';

export interface SiteContent {
  name: string;
  shortName: string;
  role: string;
  company: string;
  hometown: string;
  url: string;
  email: string;
  /** The PDF behind every "Resume" button (public/resume.pdf). */
  resume: string;
  tagline: string;
  /** For Google and link previews. */
  description: string;
  /** The line with the green dot under the hero. */
  status: string;
  /** "Sometimes it's …" in the hero, cycling. */
  cycleWords: string[];
  /** The first two sit either side of the name, the rest underneath. */
  heroStickers: { text: string; color: StickerColor; r: number }[];
  /** Short version for the home page, in your words (from "who am i.txt"). */
  aboutShort: string[];
  /** Full "who am i" text for the Journey intro. */
  aboutFull: string;
  readingList: string[];
  skills: { label: string; emoji: [string, string]; color: StickerColor }[];
  brands: string[];
  socials: { id: string; label: string; handle: string; href: string }[];
  /** Note cards on the playground. */
  stupidIdeas: { n: string; text: string }[];
  /** Project cards on the playground. `file` is a document id from content/media.json. */
  sideProjects: { name: string; note: string; href?: string; file?: string }[];
}

export const SITE = site as SiteContent;
