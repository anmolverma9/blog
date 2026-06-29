import React from 'react';
import LayoutWrapper from '@/components/public/layout-wrapper';
import SubmitClient from '@/components/public/submit-client';
import { settingsService } from '@/modules/settings';

export const revalidate = 0; // Dynamic server rendering

export default async function GuestSubmissionPage() {
  const settings = await settingsService.getSettings();
  const isPaid = settings.guest_posting_paid === 'true';
  const price = settings.guest_posting_price || '10.00';

  return (
    <LayoutWrapper>
      <SubmitClient isPaid={isPaid} price={price} />
    </LayoutWrapper>
  );
}
