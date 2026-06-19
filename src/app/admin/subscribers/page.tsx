import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SubscribersClient from './subscribers-client';

export const metadata = {
  title: 'Newsletter Subscribers',
};

export default async function AdminSubscribersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  // Ensure permission to view (must not be a front-end Subscriber or Reader)
  if (session.role === 'Subscriber' || session.role === 'Reader') {
    redirect('/admin/profile');
  }

  return <SubscribersClient session={session} />;
}
