'use strict';

import PagesListClient from './pages-list-client';

export const metadata = {
  title: 'Manage Pages',
  description: 'Manage static pages and page templates.',
};

export default function ManagePagesPage() {
  return <PagesListClient />;
}
