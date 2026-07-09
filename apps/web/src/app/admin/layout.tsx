import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import '@/styles/admin-dashboard.css';

export const metadata: Metadata = {
  title: 'Grafia CMS | Admin',
  description: 'Painel administrativo do Grafia CMS',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
