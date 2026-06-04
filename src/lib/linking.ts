import pool from './db';

export interface LinkSuggestion {
  keyword: string;
  targetPostId: number;
  targetTitle: string;
  targetSlug: string;
  suggestionText: string;
}

/**
 * Analyzes content and queries database to suggest internal linking opportunities.
 */
export async function getInternalLinkSuggestions(
  currentPostId: number | null,
  content: string
): Promise<LinkSuggestion[]> {
  if (!content || content.trim().length === 0) return [];

  try {
    // 1. Fetch all published posts from database
    const query = currentPostId
      ? 'SELECT id, title, slug FROM posts WHERE status = "published" AND id != ?'
      : 'SELECT id, title, slug FROM posts WHERE status = "published"';
    
    const params = currentPostId ? [currentPostId] : [];
    const [rows]: any = await pool.query(query, params);

    const suggestions: LinkSuggestion[] = [];
    const lowerContent = content.toLowerCase();

    // Check for existing links to prevent suggesting links that are already present
    // Matches markdown links like [text](/posts/slug) or HTML links <a href="...">
    const linkRegex = /href=["']([^"']+)["']|\]\(([^)]+)\)/gi;
    const existingSlugs: string[] = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const url = linkMatch[1] || linkMatch[2];
      if (url) {
        const slugMatch = url.match(/\/posts\/([a-zA-Z0-9-_]+)/);
        if (slugMatch && slugMatch[1]) {
          existingSlugs.push(slugMatch[1].toLowerCase());
        }
      }
    }

    // 2. Loop through other posts and check if their titles are mentioned in the content
    for (const post of rows) {
      const title = post.title;
      const slug = post.slug;

      // Skip if we already link to this post
      if (existingSlugs.includes(slug.toLowerCase())) {
        continue;
      }

      // Check for occurrences of the post title in the content
      // We will look for title matching (word boundary check)
      const titleWords = title.split(/\s+/).filter((w: string) => w.length > 3);
      if (titleWords.length === 0) continue;

      // Check whole title first
      const escapedTitle = title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const titleRegex = new RegExp(`\\b${escapedTitle}\\b`, 'i');

      if (titleRegex.test(lowerContent)) {
        suggestions.push({
          keyword: title,
          targetPostId: post.id,
          targetTitle: title,
          targetSlug: slug,
          suggestionText: `Found keyword "${title}". Consider linking to the article "${title}".`,
        });
        continue;
      }

      // Check sub-phrases of the title (e.g. 2-3 word key phrases)
      if (titleWords.length >= 2) {
        const keyPhrase = titleWords.slice(0, 3).join(' ');
        const escapedPhrase = keyPhrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const phraseRegex = new RegExp(`\\b${escapedPhrase}\\b`, 'i');

        if (phraseRegex.test(lowerContent)) {
          suggestions.push({
            keyword: keyPhrase,
            targetPostId: post.id,
            targetTitle: title,
            targetSlug: slug,
            suggestionText: `Found phrase "${keyPhrase}". Consider linking to "${title}".`,
          });
        }
      }
    }

    // Return first 5 suggestions to keep it clean and relevant
    return suggestions.slice(0, 5);
  } catch (err) {
    console.error('Error analyzing link suggestions:', err);
    return [];
  }
}
