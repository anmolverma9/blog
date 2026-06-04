'use strict';

import PagesListClient from './pages-list-client';

export const metadata = {
  title: 'Manage Pages | AppLuxe CMS',
  description: 'Manage AppLuxe static pages and page templates.',
};

export default function ManagePagesPage() {
  return <PagesListClient />;
}
