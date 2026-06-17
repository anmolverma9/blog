import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { postService } from '@/modules/posts';
import { mediaService } from '@/modules/media';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Max duration for Edge/Serverless functions. 
// Vercel Hobby max is 10s or 60s, but since we are doing 1 post at a time, 60s is plenty.
export const maxDuration = 60;

// Helper to decode WP HTML entities like &#8217;
function decodeWpEntities(text: string) {
  if (!text) return '';
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"');
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'Super Admin' && !session.permissions?.includes('manage_settings'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { post } = await req.json();
    if (!post || !post.id) {
      return NextResponse.json({ error: 'Invalid post object' }, { status: 400 });
    }

    // 1. Check if post already imported
    const [existingMeta]: any = await pool.query(
      `SELECT post_id FROM post_meta WHERE meta_key = 'wp_post_id' AND meta_value = ?`,
      [post.id.toString()]
    );

    if (existingMeta.length > 0) {
      return NextResponse.json({ skipped: true, message: `WP Post ID ${post.id} already exists (Local ID: ${existingMeta[0].post_id})` });
    }

    // 2. Handle Author mapping
    let authorId = 1; // Default fallback to system author
    let wpAuthor = null;
    if (post._embedded && post._embedded.author && post._embedded.author.length > 0) {
      wpAuthor = post._embedded.author[0];
    }
    
    if (wpAuthor && wpAuthor.name) {
      // Find user by name
      const [users]: any = await pool.query(`SELECT id FROM users WHERE name = ? LIMIT 1`, [wpAuthor.name]);
      if (users.length > 0) {
        // Find author profile
        const [authors]: any = await pool.query(`SELECT id FROM authors WHERE user_id = ?`, [users[0].id]);
        if (authors.length > 0) authorId = authors[0].id;
      } else {
        // Create user and author
        const fakeEmail = `wp_import_${wpAuthor.id}_${Date.now()}@example.com`;
        const fakePass = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        // Find Subscriber role
        const [roles]: any = await pool.query(`SELECT id FROM roles WHERE name = 'Subscriber' OR name = 'Author' LIMIT 1`);
        const roleId = roles.length > 0 ? roles[0].id : 1;

        const [userRes]: any = await pool.query(
          `INSERT INTO users (email, password_hash, name, role_id, status) VALUES (?, ?, ?, ?, 'active')`,
          [fakeEmail, fakePass, wpAuthor.name, roleId]
        );
        const newUserId = userRes.insertId;

        const [authorRes]: any = await pool.query(
          `INSERT INTO authors (user_id, bio) VALUES (?, ?)`,
          [newUserId, wpAuthor.description || 'Imported from WordPress']
        );
        authorId = authorRes.insertId;
      }
    }

    // 3. Handle Category mapping
    let categoryId = null;
    if (post._embedded && post._embedded['wp:term']) {
      const categoriesTerms = post._embedded['wp:term'][0] || [];
      if (categoriesTerms.length > 0) {
        const wpCat = categoriesTerms[0];
        const decodedCatName = decodeWpEntities(wpCat.name);
        // Check if category exists
        const [cats]: any = await pool.query(`SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1`, [decodedCatName, wpCat.slug]);
        if (cats.length > 0) {
          categoryId = cats[0].id;
        } else {
          // Create category
          const [catRes]: any = await pool.query(
            `INSERT INTO categories (name, slug, language_code) VALUES (?, ?, 'en')`,
            [decodedCatName, wpCat.slug]
          );
          categoryId = catRes.insertId;
        }
      }
    }

    // 4. Handle Featured Image Download
    let featuredImageId = null;
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'].length > 0) {
      const mediaItem = post._embedded['wp:featuredmedia'][0];
      const sourceUrl = mediaItem.source_url;

      if (sourceUrl) {
        try {
          const urlHash = crypto.createHash('md5').update(sourceUrl).digest('hex');
          const fileName = `wp-${urlHash}-${path.basename(sourceUrl).split('?')[0] || 'image.jpg'}`;

          // Check if this media file was already downloaded
          const [existingMedia]: any = await pool.query('SELECT id FROM media WHERE filename = ? LIMIT 1', [fileName]);
          
          if (existingMedia.length > 0) {
            featuredImageId = existingMedia[0].id;
          } else {
            // Download image
            const resMedia = await fetch(sourceUrl);
            if (resMedia.ok) {
              const buffer = await resMedia.arrayBuffer();
              const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'wp-imports');
              
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              
              const filePath = path.join(uploadDir, fileName);
              fs.writeFileSync(filePath, Buffer.from(buffer));

              const dbPath = `/uploads/wp-imports/${fileName}`;
              const mimeType = resMedia.headers.get('content-type') || 'image/jpeg';
              
              featuredImageId = await mediaService.addMedia({
                filename: fileName,
                file_path: dbPath,
                file_size: buffer.byteLength,
                mime_type: mimeType,
                alt_text: mediaItem.alt_text || post.title.rendered,
                title_text: mediaItem.title ? mediaItem.title.rendered : undefined,
              });
            }
          }
        } catch (e) {
          console.error(`Failed to download media for WP Post ${post.id}:`, e);
        }
      }
    }

    // 4b. Handle Inline Media Download
    let contentHtml = post.content ? post.content.rendered : '';
    // Regex to find any src pointing to a wp-content/uploads directory
    const inlineMediaRegex = /src=["'](https?:\/\/[^"']+\/wp-content\/uploads\/[^"']+)["']/gi;
    const matches = [...contentHtml.matchAll(inlineMediaRegex)];
    
    // Deduplicate URLs to avoid downloading the same image multiple times if used multiple times
    const uniqueUrls = [...new Set(matches.map(m => m[1]))];
    
    for (const sourceUrl of uniqueUrls) {
      try {
        const urlHash = crypto.createHash('md5').update(sourceUrl).digest('hex');
        const fileName = `wp-inline-${urlHash}-${path.basename(sourceUrl).split('?')[0] || 'media.jpg'}`;

        // Check if this inline media file was already downloaded
        const [existingMedia]: any = await pool.query('SELECT file_path FROM media WHERE filename = ? LIMIT 1', [fileName]);
        
        if (existingMedia.length > 0) {
          // Replace URL with existing local path
          contentHtml = contentHtml.replaceAll(sourceUrl, existingMedia[0].file_path);
        } else {
          const resMedia = await fetch(sourceUrl);
          if (resMedia.ok) {
            const buffer = await resMedia.arrayBuffer();
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'wp-imports');
            
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(buffer));

            const dbPath = `/uploads/wp-imports/${fileName}`;
            const mimeType = resMedia.headers.get('content-type') || 'application/octet-stream';
            
            // Add to media library
            await mediaService.addMedia({
              filename: fileName,
              file_path: dbPath,
              file_size: buffer.byteLength,
              mime_type: mimeType,
              alt_text: `Imported inline media for ${post.id}`,
            });
            
            // Replace all instances of the original URL with the new local path in the HTML
            contentHtml = contentHtml.replaceAll(sourceUrl, dbPath);
          }
        }
      } catch (e) {
        console.error(`Failed to download inline media ${sourceUrl}:`, e);
      }
    }

    // 5. Insert Post
    const localSlug = `${post.slug || 'wp-post-' + post.id}`;
    
    let focusKeyword = '';
    if (post.meta && post.meta.rank_math_focus_keyword && post.meta.rank_math_focus_keyword.length > 0) {
      focusKeyword = post.meta.rank_math_focus_keyword[0];
    } else if (post.meta && post.meta.yoast_wpseo_focuskw && post.meta.yoast_wpseo_focuskw.length > 0) {
      focusKeyword = post.meta.yoast_wpseo_focuskw[0];
    }
    focusKeyword = focusKeyword.replace(/[\t\r\n]/g, '').trim();

    let metaTitle = decodeWpEntities(post.title.rendered) || '';
    if (post.meta && post.meta.rank_math_title && post.meta.rank_math_title.length > 0) {
      metaTitle = post.meta.rank_math_title[0];
    } else if (post.meta && post.meta.yoast_wpseo_title && post.meta.yoast_wpseo_title.length > 0) {
      metaTitle = post.meta.yoast_wpseo_title[0];
    }

    let metaDescription = post.excerpt ? decodeWpEntities(post.excerpt.rendered.replace(/<[^>]*>?/gm, '')) : '';
    if (post.meta && post.meta.rank_math_description && post.meta.rank_math_description.length > 0) {
      metaDescription = post.meta.rank_math_description[0];
    } else if (post.meta && post.meta.yoast_wpseo_metadesc && post.meta.yoast_wpseo_metadesc.length > 0) {
      metaDescription = post.meta.yoast_wpseo_metadesc[0];
    }

    const postData = {
      title: decodeWpEntities(post.title.rendered) || 'Untitled WP Post',
      slug: localSlug,
      content: contentHtml,
      summary: post.excerpt ? decodeWpEntities(post.excerpt.rendered.replace(/<[^>]*>?/gm, '')) : '',
      status: post.status === 'publish' ? 'published' : 'draft',
      published_at: post.date ? new Date(post.date).toISOString().slice(0, 19).replace('T', ' ') : null,
      author_id: authorId,
      category_id: categoryId,
      featured_image_id: featuredImageId,
      language_code: 'en', // Enforced english
      meta: {
        wp_post_id: post.id.toString(),
        wp_link: post.link,
        focus_keyword: focusKeyword,
      },
      seo: {
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: focusKeyword,
      }
    };

    const newPostId = await postService.createPost(postData);

    return NextResponse.json({ success: true, message: `Imported successfully as Local ID ${newPostId}` });

  } catch (err: any) {
    console.error('WP Import Single Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
