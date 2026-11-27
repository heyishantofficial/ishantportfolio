// Types for server/post-format.mjs (plain JS, so the server can run it without a build step).

export type Kind = 'blog' | 'case-study' | 'dream-campaign';

export interface ParsedPost {
  slug: string;
  kind: Kind;
  title: string;
  summary: string;
  date: string;
  brand?: string;
  role?: string;
  cover?: string;
  tags: string[];
  results: { value: string; label: string }[];
  draft: boolean;
  body: string;
}

export interface PostFields {
  kind: Kind;
  title: string;
  summary: string;
  date: string;
  brand?: string;
  role?: string;
  cover?: string;
  tags?: string[];
  results?: { value: string; label: string }[];
  draft?: boolean;
  body?: string;
}

export const KINDS: Kind[];
export const FIELDS: string[];
export const SLUG: RegExp;
export const WORK_LINE: RegExp;

export class PostError extends Error {
  constructor(file: string, message: string);
  file: string;
  reason: string;
}

export function slugify(s: string): string;
export function frontmatter(src: string, file: string): { data: Record<string, string | string[] | boolean>; body: string };
export function parsePost(src: string, file: string): ParsedPost;
export function localImages(post: ParsedPost): { src: string; path: string }[];
export function workIds(post: ParsedPost): string[];
export function serializePost(p: PostFields): string;
