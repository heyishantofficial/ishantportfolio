import { SiteFrame } from '@/components/SiteFrame';

// Every public page sits in the site's frame. /admin (app/admin) has none of it.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
