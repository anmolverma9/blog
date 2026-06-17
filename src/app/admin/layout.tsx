import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Header from '@/components/admin/header';
import AdminClientShell from '@/components/admin/admin-client-shell';
import { settingsService } from '@/modules/settings';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  let siteName = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    siteName = settings.site_name || 'Blog';
  } catch {}

  return {
    title: {
      template: `%s | ${siteName} CMS`,
      default: `${siteName} CMS`,
    },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  let siteName = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    siteName = settings.site_name || 'Blog';
  } catch {}

  return (
    <AdminClientShell session={session} siteName={siteName}>
      {children}
    </AdminClientShell>
  );
}
