import React from 'react';
import PostEditor from '@/components/admin/post-editor';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditPostPageProps) {
  const { id } = await params;
  return {
    title: `Edit Article #${id}`,
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const postId = Number(id);

  return <PostEditor postId={postId} />;
}
