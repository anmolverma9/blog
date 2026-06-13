import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Sidebar from '@/components/admin/sidebar';
import Header from '@/components/admin/header';
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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar session={session} siteName={siteName} />

      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header session={session} siteName={siteName} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
