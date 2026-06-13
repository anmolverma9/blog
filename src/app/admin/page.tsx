'use strict';

import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Dashboard',
  description: 'CMS workspace analytics overview.',
};

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
