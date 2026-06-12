import React from 'react';
import LayoutWrapper from '@/components/public/layout-wrapper';
import SoftwareClient from '@/components/public/software-client';

export const revalidate = 0; // Dynamic server rendering

export default async function SoftwareDirectoryPage() {
  return (
    <LayoutWrapper>
      <SoftwareClient />
    </LayoutWrapper>
  );
}
