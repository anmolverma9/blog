import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [[{ total_posts }]]: any = await pool.query(`SELECT COUNT(*) as total_posts FROM posts WHERE status = 'published'`);
    const [[{ total_images }]]: any = await pool.query(`SELECT COUNT(*) as total_images FROM media`);

    const [[{ missing_title }]]: any = await pool.query(`
      SELECT COUNT(*) as missing_title 
      FROM posts p 
      LEFT JOIN seo_data s ON s.entity_id = p.id AND s.entity_type = 'post' 
      WHERE p.status = 'published' AND (s.meta_title IS NULL OR s.meta_title = '')
    `);

    const [[{ missing_desc }]]: any = await pool.query(`
      SELECT COUNT(*) as missing_desc 
      FROM posts p 
      LEFT JOIN seo_data s ON s.entity_id = p.id AND s.entity_type = 'post' 
      WHERE p.status = 'published' AND (s.meta_description IS NULL OR s.meta_description = '')
    `);

    const [[{ missing_keywords }]]: any = await pool.query(`
      SELECT COUNT(*) as missing_keywords 
      FROM posts p 
      LEFT JOIN seo_data s ON s.entity_id = p.id AND s.entity_type = 'post' 
      WHERE p.status = 'published' AND (s.meta_keywords IS NULL OR s.meta_keywords = '')
    `);

    const [[{ images_missing_alt }]]: any = await pool.query(`
      SELECT COUNT(*) as images_missing_alt 
      FROM media 
      WHERE alt_text IS NULL OR alt_text = ''
    `);

    const posts = parseInt(total_posts) || 0;
    const imgs = parseInt(total_images) || 0;

    let score = 100;
    const issues = [];
    const metrics = {
      totalPosts: posts,
      totalImages: imgs,
      missingMetaTitle: parseInt(missing_title) || 0,
      missingMetaDesc: parseInt(missing_desc) || 0,
      missingFocusKeyword: parseInt(missing_keywords) || 0,
      imagesMissingAlt: parseInt(images_missing_alt) || 0,
    };

    if (posts > 0) {
      if (metrics.missingMetaTitle > 0) {
        score -= (metrics.missingMetaTitle / posts) * 20;
        issues.push({ type: 'warning', message: `${metrics.missingMetaTitle} published posts are missing a custom meta title.` });
      }
      if (metrics.missingMetaDesc > 0) {
        score -= (metrics.missingMetaDesc / posts) * 30;
        issues.push({ type: 'error', message: `${metrics.missingMetaDesc} published posts are missing a custom meta description.` });
      }
      if (metrics.missingFocusKeyword > 0) {
        score -= (metrics.missingFocusKeyword / posts) * 25;
        issues.push({ type: 'warning', message: `${metrics.missingFocusKeyword} published posts are missing a focus keyword.` });
      }
    } else {
        score = 0;
        issues.push({ type: 'warning', message: 'No published posts found to analyze.' });
    }

    if (imgs > 0) {
      if (metrics.imagesMissingAlt > 0) {
        score -= (metrics.imagesMissingAlt / imgs) * 25;
        issues.push({ type: 'warning', message: `${metrics.imagesMissingAlt} images in your media library are missing alt text.` });
      }
    }

    // Success state
    if (score === 100 && posts > 0) {
      issues.push({ type: 'success', message: 'Perfect SEO Health! All posts and images have complete metadata.' });
    }

    return NextResponse.json({
      score: Math.max(0, Math.round(score)),
      metrics,
      issues
    });

  } catch (err: any) {
    console.error('SEO Health API Error:', err.message);
    return NextResponse.json({ error: 'Failed to compute SEO health' }, { status: 500 });
  }
}
