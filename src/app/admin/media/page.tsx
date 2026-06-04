'use strict';

import MediaClient from './media-client';

export const metadata = {
  title: 'Media Library | AppLuxe CMS',
  description: 'Upload and organize media, configure alternative tags and meta values.',
};

export default function MediaLibraryPage() {
  return <MediaClient />;
}
