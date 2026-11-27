import Link from 'next/link';
import { SiteFrame } from '@/components/SiteFrame';
import { Sticker } from '@/components/ui';

export default function NotFound() {
  return (
    <SiteFrame>
    <div className="container section" style={{ display: 'grid', gap: 22, justifyItems: 'center', textAlign: 'center' }}>
      <Sticker color="pink" r={-4}>
        error 404
      </Sticker>
      <h1 className="px t-1 balance" style={{ margin: 0 }}>
        This page got lost in the edit
      </h1>
      <p className="hand" style={{ fontSize: '1.8rem', margin: 0 }}>
        happens to the best of us.
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="btn" href="/">
          take me home
        </Link>
        <Link className="btn btn-ghost" href="/work">
          see the work
        </Link>
      </div>
    </div>
    </SiteFrame>
  );
}
