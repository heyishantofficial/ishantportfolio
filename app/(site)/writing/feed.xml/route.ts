import { SITE } from '@/content/site';
import { POST_KINDS, WRITING } from '@/content/writing';
import { getPublishedPosts } from '@/lib/posts';

// RSS for the Writing page, built with the site (out/writing/feed.xml). Drafts never appear.
export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const posts = getPublishedPosts();
  const items = posts
    .map((p) => {
      const url = `${SITE.url}/writing/${p.slug}`;
      const html = p.blocks.map((b) => (b.type === 'html' ? b.html : `<p><a href="${url}">Watch the work on the site.</a></p>`)).join('\n');
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${p.date}T09:00:00+05:30`).toUTCString()}</pubDate>
      <category>${esc(POST_KINDS[p.kind].label)}</category>
      <description>${esc(p.summary)}</description>
      <content:encoded><![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>').replace(/(src|href)="\//g, `$1="${SITE.url}/`)}]]></content:encoded>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${WRITING.title} · ${SITE.name}`)}</title>
    <link>${SITE.url}/writing</link>
    <atom:link href="${SITE.url}/writing/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(WRITING.lede)}</description>
    <language>en-in</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
