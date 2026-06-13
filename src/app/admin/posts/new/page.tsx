'use strict';

import PostEditor from '@/components/admin/post-editor';

export const metadata = {
  title: 'Create New Article',
  description: 'Write and publish a new article.',
};

export default function NewPostPage() {
  return <PostEditor />;
}
