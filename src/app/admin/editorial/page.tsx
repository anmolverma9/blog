import React from 'react';
import EditorialClient from './editorial-client';

export const metadata = {
  title: 'Editorial Board Queue — AppLuxe CMS',
};

export default function EditorialAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EditorialClient />
    </div>
  );
}
