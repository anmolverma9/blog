'use strict';

import MediaClient from './media-client';

export const metadata = {
  title: 'Media Library',
  description: 'Upload and organize media, configure alternative tags and meta values.',
};

export default function MediaLibraryPage() {
  return <MediaClient />;
}
