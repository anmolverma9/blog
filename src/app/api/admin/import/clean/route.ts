import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { mediaService } from '@/modules/media';

export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  if (!session || (session.role !== 'Super Admin' && !session.permissions?.includes('manage_settings'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find media IDs that are NOT used as featured_image_id in posts, and NOT used as avatar_id in authors
    // We restrict cleanup to files that are in /uploads/wp-imports/ to avoid deleting user-uploaded generic media just in case
    const [orphans]: any = await pool.query(`
      SELECT id, file_path 
      FROM media 
      WHERE file_path LIKE '%/uploads/wp-imports/%'
      AND id NOT IN (SELECT featured_image_id FROM posts WHERE featured_image_id IS NOT NULL)
      AND id NOT IN (SELECT avatar_id FROM authors WHERE avatar_id IS NOT NULL)
    `);

    let deletedCount = 0;
    for (const orphan of orphans) {
      await mediaService.deleteMedia(orphan.id);
      deletedCount++;
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (err: any) {
    console.error('WP Import Clean Orphaned Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
