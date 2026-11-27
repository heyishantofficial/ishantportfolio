// The Writing page: blog posts, written case studies and dream campaigns.
// The posts themselves are Markdown files in content/posts/ (README: "Posting on Writing").
// This file holds the page's own words and how each kind of post looks.

import type { StickerColor } from './site';

export type PostKind = 'blog' | 'case-study' | 'dream-campaign';

export const POST_KINDS: Record<PostKind, { label: string; plural: string; icon: string; color: StickerColor; brandWord: string }> = {
  blog: { label: 'blog', plural: 'Blog', icon: '✎', color: 'sky', brandWord: 'about' },
  'case-study': { label: 'case study', plural: 'Case studies', icon: '◼', color: 'mint', brandWord: 'with' },
  'dream-campaign': { label: 'dream campaign', plural: 'Dream campaigns', icon: '✦', color: 'blush', brandWord: 'for' },
};

export const WRITING = {
  hand: 'thoughts, cases & dreams',
  title: 'Writing',
  lede: "Notes on content, brands and AI. Case studies that go past the reel. And dream campaigns: ideas I'd love to make for brands that haven't asked me (yet).",
  empty: 'Nothing here yet. The first post is in the oven.',
  /** Sits at the top of every dream campaign, so nobody mistakes it for a real brief. */
  dreamNote: (brand: string) => `A dream campaign: an idea I'd love to make for ${brand}. ${brand} didn't ask for it, pay for it or approve it. Yet.`,
  /** The sign-off note at the end of every post. */
  cta: {
    hand: 'got a brief?',
    text: "If this is the kind of thinking you need, let's talk.",
    dream: (brand: string) => `Work at ${brand}? Let's make this one real.`,
  },
};

/** What the list page needs from each post (no body). */
export interface PostSummary {
  slug: string;
  kind: PostKind;
  title: string;
  summary: string;
  /** YYYY-MM-DD */
  date: string;
  /** "27 Nov 2026" */
  dateLabel: string;
  minutes: number;
  brand?: string;
  cover?: string;
  tags: string[];
  draft: boolean;
}
