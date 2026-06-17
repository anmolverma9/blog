import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'Super Admin' && !session.permissions?.includes('manage_settings'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [[localPostsCount]]: any = await pool.query('SELECT COUNT(*) as total FROM posts');
    
    // Get all distinct imported wp_post_ids
    const [importedRows]: any = await pool.query(`SELECT meta_value FROM post_meta WHERE meta_key = 'wp_post_id'`);
    const importedIds = importedRows.map((r: any) => parseInt(r.meta_value, 10));

    return NextResponse.json({
      success: true,
      totalLocalPosts: localPostsCount.total || 0,
      totalImported: importedIds.length,
      importedIds: importedIds // Pass down so client can diff against WP
    });
  } catch (err: any) {
    console.error('WP Stats Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
