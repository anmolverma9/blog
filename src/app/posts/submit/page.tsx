import React from 'react';
import LayoutWrapper from '@/components/public/layout-wrapper';
import SubmitClient from '@/components/public/submit-client';

export const revalidate = 0; // Dynamic server rendering

export default async function GuestSubmissionPage() {
  return (
    <LayoutWrapper>
      <SubmitClient />
    </LayoutWrapper>
  );
}
