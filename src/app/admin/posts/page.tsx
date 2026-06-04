'use strict';

import PostsListClient from './posts-list-client';

export const metadata = {
  title: 'Manage Posts | AppLuxe CMS',
  description: 'Manage AppLuxe blog posts, scheduled publishing, and drafts.',
};

export default function ManagePostsPage() {
  return <PostsListClient />;
}
