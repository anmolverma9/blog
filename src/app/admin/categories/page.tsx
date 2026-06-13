'use strict';

import CategoriesClient from './categories-client';

export const metadata = {
  title: 'Categories & Tags',
  description: 'Manage taxonomies, article categories, parent relationships, and tags.',
};

export default function TaxonomiesPage() {
  return <CategoriesClient />;
}
