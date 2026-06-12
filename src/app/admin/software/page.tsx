import React from 'react';
import SoftwareClient from './software-client';

export const metadata = {
  title: 'Software Directory Manager — AppLuxe CMS',
};

export default function SoftwareAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SoftwareClient />
    </div>
  );
}
