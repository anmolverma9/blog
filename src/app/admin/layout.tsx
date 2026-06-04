import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Sidebar from '@/components/admin/sidebar';
import Header from '@/components/admin/header';

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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar session={session} />

      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header session={session} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
