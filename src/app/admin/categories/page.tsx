'use strict';

import CategoriesClient from './categories-client';

export const metadata = {
  title: 'Categories & Tags | AppLuxe CMS',
  description: 'Manage taxonomies, article categories, parent relationships, and tags.',
};

export default function TaxonomiesPage() {
  return <CategoriesClient />;
}
