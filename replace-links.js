const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const [search, replace] of replacements) {
    // string search replaces only the first occurrence by default in old JS, 
    // but we can use split/join for global replace of exact strings.
    newContent = newContent.split(search).join(replace);
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
  }
}

const files = [
  'src/modules/posts/index.ts',
  'src/lib/seo.ts',
  'src/lib/linking.ts',
  'src/components/public/visual-renderer.tsx',
  'src/components/public/sidebar.tsx',
  'src/components/public/hero-slider.tsx',
  'src/components/admin/post-editor.tsx',
  'src/app/tags/[slug]/page.tsx',
  'src/app/sitemap.ts',
  'src/app/search/page.tsx',
  'src/app/posts/page.tsx',
  'src/app/page.tsx',
  'src/app/categories/[slug]/page.tsx',
  'src/app/authors/[id]/page.tsx',
  'src/app/archives/page.tsx',
  'src/app/api/admin/seo/scan-links/route.ts',
  'src/app/admin/redirects/redirects-client.tsx',
  'src/app/admin/posts/posts-list-client.tsx',
  'src/app/admin/editorial/editorial-client.tsx'
];

const stringReplacements = [
  ['`/posts/${post.slug}`', '`/${post.slug}`'],
  ['`/posts/${rel.slug}`', '`/${rel.slug}`'],
  ['`/posts/${slug}`', '`/${slug}`'],
  ['href="/posts/${', 'href="/${'],
  ['href={`/posts/${', 'href={`/${'],
  // Custom
  ['canonical_url: seoData.canonical_url || `/posts/${post.slug}`', 'canonical_url: seoData.canonical_url || `/${post.slug}`'],
  ['\'@id\': `${siteUrl}/posts/${post.slug}`', '\'@id\': `${siteUrl}/${post.slug}`'],
  ['[text](/posts/slug)', '[text](/slug)'],
  ['setCanonicalUrl(`/posts/${slug}`)', 'setCanonicalUrl(`/${slug}`)'],
  ['text-slate-400 border-r border-slate-200\">/posts/</span>', 'text-slate-400 border-r border-slate-200\">/</span>'],
  ['text-orange-600\">/posts/{sug.targetSlug}', 'text-orange-600\">/{sug.targetSlug}'],
  ['text-xs text-slate-400 border-r border-slate-200\">/posts/</span>', 'text-xs text-slate-400 border-r border-slate-200\">/</span>'],
  ['url: `${siteUrl}/posts/${post.slug}`', 'url: `${siteUrl}/${post.slug}`'],
  ['cleanUrl.startsWith(\'/posts/\')', 'cleanUrl.startsWith(\'/\')'],
  ['Change link to /posts/${closest}', 'Change link to /${closest}'],
  ['e.g. /posts/new-seo-friendly-path', 'e.g. /new-seo-friendly-path'],
  ['Author: {selectedPost.author_name} • Slug: /posts/{selectedPost.slug}', 'Author: {selectedPost.author_name} • Slug: /{selectedPost.slug}']
];

for (const file of files) {
  const fullPath = path.join('d:\\blog', file);
  replaceInFile(fullPath, stringReplacements);
}
