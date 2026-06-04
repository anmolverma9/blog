'use strict';

import PostEditor from '@/components/admin/post-editor';

export const metadata = {
  title: 'Create New Article | AppLuxe CMS',
  description: 'Write and publish a new article to the AppLuxe blog.',
};

export default function NewPostPage() {
  return <PostEditor />;
}
