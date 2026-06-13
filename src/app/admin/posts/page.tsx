'use strict';

import PostsListClient from './posts-list-client';

export const metadata = {
  title: 'Manage Posts',
  description: 'Manage blog posts, scheduled publishing, and drafts.',
};

export default function ManagePostsPage() {
  return <PostsListClient />;
}
