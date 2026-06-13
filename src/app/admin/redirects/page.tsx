'use strict';

import RedirectsClient from './redirects-client';

export const metadata = {
  title: 'Redirects Manager',
  description: 'Manage 301 and 302 URL redirects to preserve SEO rankings during page migrations.',
};

export default function RedirectsPage() {
  return <RedirectsClient />;
}
