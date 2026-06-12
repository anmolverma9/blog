import React from 'react';
import KBClient from './kb-client';

export const metadata = {
  title: 'Help Center & Documentation — AppLuxe CMS',
};

export default function KBAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <KBClient />
    </div>
  );
}
