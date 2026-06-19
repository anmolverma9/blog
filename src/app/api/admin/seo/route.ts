import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { settingsService } from '@/modules/settings';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await settingsService.getSettings();
    
    // Query 404 logs
    const [logs]: any = await pool.query('SELECT * FROM seo_404_logs ORDER BY id DESC LIMIT 100');

    return NextResponse.json({
      settings: {
        site_title: settings.site_title || 'AppLuxe CMS Platform',
        site_description: settings.site_description || 'Next generation advertising platform.',
        default_meta_title: settings.default_meta_title || '',
        default_meta_description: settings.default_meta_description || '',
        meta_robots_indexing: settings.meta_robots_indexing || 'index, follow',
        robots_txt_content: settings.robots_txt_content || 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/*',
        social_og_image: settings.social_og_image || '',
        social_twitter_card: settings.social_twitter_card || 'summary_large_image',
        org_schema_name: settings.org_schema_name || 'AppLuxe',
        org_schema_logo: settings.org_schema_logo || '',
        org_schema_social: settings.org_schema_social || '[]',
        web_schema_name: settings.web_schema_name || 'AppLuxe Blog Hub',
      },
      logs,
    });
  } catch (err: any) {
    console.error('Admin GET SEO error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Validate body
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Save key-value settings directly
    await settingsService.saveSettings(body);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin POST SEO error:', err.message);
    return NextResponse.json({ error: 'Failed to save SEO settings' }, { status: 500 });
  }
}

// Clear 404 Logs
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pool.query('DELETE FROM seo_404_logs');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE 404 logs error:', err.message);
    return NextResponse.json({ error: 'Failed to clear 404 logs' }, { status: 500 });
  }
}
