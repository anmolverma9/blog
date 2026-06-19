export interface SEOSuggestions {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  altTextSuggestions: string[];
  imageTitleSuggestions: string[];
}

/**
 * Automatically generates SEO suggestions based on post content.
 */
export function generateAutoSEOSuggestions(
  title: string,
  content: string,
  summary: string,
  siteName?: string
): SEOSuggestions {
  const cleanTitle = title.trim();
  const baseName = siteName || 'Blog';
  const blogName = baseName.toLowerCase().endsWith('blog') ? baseName : `${baseName} Blog`;

  // 1. Meta Title (Max 60 chars recommended)
  let metaTitle = cleanTitle;
  if (metaTitle.length + blogName.length + 3 <= 60) {
    metaTitle = `${cleanTitle} | ${blogName}`;
  }

  // 2. Meta Description (Max 160 chars recommended)
  let metaDescription = '';
  if (summary && summary.trim().length > 0) {
    metaDescription = summary.trim();
  } else {
    // Strip HTML/Markdown tags and get first 150 chars
    const plainText = content
      .replace(/<[^>]*>/g, '') // Strip HTML
      .replace(/[#*`_\[\]()]/g, '') // Strip basic MD syntax
      .replace(/\s+/g, ' ')
      .trim();
    metaDescription = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  }

  // 3. Image Alt and Title suggestions
  // Find all images in markdown format: ![alt](url)
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const altTextSuggestions: string[] = [];
  const imageTitleSuggestions: string[] = [];

  let match;
  let imgIndex = 1;
  while ((match = mdImgRegex.exec(content)) !== null) {
    const existingAlt = match[1]?.trim();
    const url = match[2];
    const filename = url.split('/').pop()?.split('?')[0] || '';
    const cleanFilename = filename.replace(/[-_]/g, ' ').replace(/\.[a-zA-Z0-9]+$/, '');

    // Alt text suggestion: use title + illustration/screenshot, or clean filename
    const altSuggestion = existingAlt || `${cleanTitle} illustration ${imgIndex}`;
    const titleSuggestion = cleanFilename || `${cleanTitle} image ${imgIndex}`;

    altTextSuggestions.push(altSuggestion);
    imageTitleSuggestions.push(titleSuggestion);
    imgIndex++;
  }

  // If no images found, suggest standard placeholders
  if (altTextSuggestions.length === 0) {
    altTextSuggestions.push(`${cleanTitle} featured image`);
    imageTitleSuggestions.push(`${cleanTitle} cover`);
  }

  return {
    metaTitle,
    metaDescription: metaDescription.substring(0, 160),
    ogTitle: metaTitle,
    ogDescription: metaDescription.substring(0, 160),
    altTextSuggestions,
    imageTitleSuggestions,
  };
}

/**
 * Generates JSON-LD schema markup for Articles.
 */
export function generateArticleSchema(post: {
  title: string;
  slug: string;
  summary: string;
  published_at: string;
  updated_at?: string | Date;
  author_name: string;
  author_avatar_url?: string;
  featured_image_url?: string;
  category_name?: string;
}, siteName?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const authorSlug = post.author_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.summary || post.title,
    'image': post.featured_image_url ? `${siteUrl}${post.featured_image_url}` : `${siteUrl}/images/default-blog.jpg`,
    'datePublished': post.published_at,
    'dateModified': post.updated_at ? new Date(post.updated_at).toISOString() : post.published_at,
    'author': {
      '@type': 'Person',
      'name': post.author_name,
      'url': `${siteUrl}/authors/${authorSlug}`,
      'image': post.author_avatar_url || undefined,
      'jobTitle': 'Author',
      'worksFor': {
        '@type': 'Organization',
        'name': siteName || 'Blog',
      }
    },
    'publisher': {
      '@type': 'Organization',
      'name': siteName || 'Blog',
      'url': siteUrl,
      'logo': {
        '@type': 'ImageObject',
        'url': `${siteUrl}/logo.png`,
      },
      'description': `Official blog of ${siteName || 'Blog'}`,
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${siteUrl}/${post.slug}`,
    },
  };
}

/**
 * Generates JSON-LD schema markup for FAQs.
 */
export function generateFAQSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };
}

/**
 * Generates JSON-LD schema markup for Product Reviews.
 */
export function generateReviewSchema(review: {
  productName: string;
  rating: number;
  ratingMax: number;
  summary: string;
  authorName: string;
  buyUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': review.productName,
    'review': {
      '@type': 'Review',
      'author': {
        '@type': 'Person',
        'name': review.authorName
      },
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': review.rating,
        'bestRating': review.ratingMax
      },
      'reviewBody': review.summary
    }
  };
}

/**
 * Generates JSON-LD schema markup for Breadcrumbs.
 */
export function generateBreadcrumbSchema(links: Array<{ name: string; url: string }>) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': links.map((link, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': link.name,
      'item': link.url.startsWith('http') ? link.url : `${siteUrl}${link.url}`
    }))
  };
}

/**
 * Generates JSON-LD schema markup for How-To instructions.
 */
export function generateHowToSchema(howto: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; url?: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': howto.name,
    'description': howto.description,
    'step': howto.steps.map((step, idx) => ({
      '@type': 'HowToStep',
      'position': idx + 1,
      'name': step.name,
      'text': step.text,
      'url': step.url
    }))
  };
}
