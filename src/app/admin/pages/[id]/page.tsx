import React from 'react';
import PageEditor from '@/components/admin/page-editor';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPageProps) {
  const { id } = await params;
  return {
    title: `Edit Page #${id}`,
  };
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  const pageId = Number(id);

  return <PageEditor pageId={pageId} />;
}
