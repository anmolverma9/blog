import React from 'react';
import LayoutWrapper from '@/components/public/layout-wrapper';
import KnowledgeBaseClient from '@/components/public/kb-client';

export const revalidate = 0; // Dynamic server rendering

export default async function KBPage() {
  return (
    <LayoutWrapper>
      <KnowledgeBaseClient />
    </LayoutWrapper>
  );
}
