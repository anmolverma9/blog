import React from 'react';
import { getSession, hasPermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsersClient from './users-client';

export const metadata = {
  title: 'Users & Roles | AppLuxe CMS',
};

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  // Ensure permission to manage users
  if (!hasPermission(session, 'manage_users')) {
    redirect('/admin/profile');
  }

  return <UsersClient session={session} />;
}
