import React from 'react';
import SEOClient from './seo-client';

export const metadata = {
  title: 'SEO Settings — AppLuxe CMS',
};

export default function SEOAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SEOClient />
    </div>
  );
}
