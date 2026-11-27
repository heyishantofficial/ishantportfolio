import type { Metadata, Viewport } from 'next';
import { Admin } from '@/components/admin/Admin';
import './admin.css';

// heyishant.com/admin. The page itself is static and holds no content: everything
// comes from the CMS API (server/cms.mjs) after you log in.

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export const viewport: Viewport = { themeColor: '#fbfaf6' };

export default function AdminPage() {
  return <Admin />;
}
