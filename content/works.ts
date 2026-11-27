import works from './data/works.json';

// Every piece of work on the site, in the order it appears. The list itself is
// content/data/works.json, which the CMS (/admin) edits; this file holds its types.
// kind: video and image play from /media and /img (see scripts/media-sources.json);
//       youtube plays the YouTube video; link opens a website.
// caseSlug puts the piece inside a featured case (content/cases.ts).
// To add work by hand: add a row to works.json, and for a video or image add its source file to
// scripts/media-sources.json, then run `npm run media:encode`.

export type Category = 'campaigns' | 'brand' | 'youtube' | 'ai' | 'sets';
export type WorkKind = 'video' | 'youtube' | 'image' | 'link';

export interface Work {
  id: string;
  title: string;
  brand?: string;
  category: Category;
  kind: WorkKind;
  youtubeId?: string;
  /** YouTube Shorts and other vertical YouTube videos */
  short?: boolean;
  /** Original post (Instagram) or website */
  href?: string;
  caseSlug?: string;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'brand', label: 'Brand content' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'ai', label: 'AI' },
  { id: 'sets', label: 'Set design' },
];

export const WORKS = works as Work[];
