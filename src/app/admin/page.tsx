'use strict';

import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Dashboard | AppLuxe CMS',
  description: 'AppLuxe CMS workspace analytics overview.',
};

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
