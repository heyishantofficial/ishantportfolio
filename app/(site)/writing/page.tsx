import type { Metadata } from 'next';
import Link from 'next/link';
import { PostList } from '@/components/PostList';
import { WRITING } from '@/content/writing';
import { getPosts, summaryOf } from '@/lib/posts';

export const metadata: Metadata = {
  title: WRITING.title,
  description: WRITING.lede,
  alternates: { canonical: '/writing', types: { 'application/rss+xml': '/writing/feed.xml' } },
};

export default function WritingPage() {
  const posts = getPosts().map(summaryOf);
  return (
    <div className="container section-tight">
      <header className="sec-head">
        <span className="hand">{WRITING.hand}</span>
        <h1 className="px t-1">{WRITING.title}</h1>
        <p className="muted lede">{WRITING.lede}</p>
        <p className="label muted" style={{ margin: 0 }}>
          the video case studies live in{' '}
          <Link href="/work" className="link-underline">
            work
          </Link>
          {posts.some((p) => !p.draft) ? (
            <>
              {' · '}
              <a href="/writing/feed.xml" className="link-underline">
                rss feed
              </a>
            </>
          ) : null}
        </p>
      </header>
      {posts.length ? (
        <PostList posts={posts} />
      ) : (
        <div className="post-empty">
          <p className="hand">{WRITING.empty}</p>
          <Link className="btn btn-ghost" href="/work">
            see the work meanwhile ↗
          </Link>
        </div>
      )}
    </div>
  );
}
