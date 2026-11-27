import cases from './data/cases.json';

// The featured cases, in the order the home page shows them. The text is
// content/data/cases.json, which the CMS (/admin) edits; this file holds its types.
// Empty fields (brief, idea, results) are hidden on the live site and show up
// as "needs" notes on the preview build, so you can see what to send.

export interface CaseStudy {
  slug: string;
  tab: string;
  color: 'ink' | 'yellow' | 'blue' | 'pink';
  brand: string;
  title: string;
  oneLiner: string;
  period?: string;
  role?: string;
  team?: string;
  tools?: string[];
  tags: string[];
  /** What sits in the card and at the top of the case page. */
  cover: { kind: 'youtube'; id: string } | { kind: 'video'; id: string } | { kind: 'photo'; id: string };
  /** Your own words about the work. Shown as "the context". */
  context?: string;
  brief?: string;
  idea?: string;
  results?: { value: string; label: string }[];
  /** Behind-the-scenes photo ids (content/media.json). */
  bts?: string[];
  todo?: string[];
}

export const CASES = cases as CaseStudy[];

export const caseBySlug = (slug: string) => CASES.find((c) => c.slug === slug);
