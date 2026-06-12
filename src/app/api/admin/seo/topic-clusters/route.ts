import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all clusters
    const [clusters]: any = await pool.query(`
      SELECT tc.*, COUNT(ptc.post_id) as posts_count
      FROM topic_clusters tc
      LEFT JOIN post_topic_clusters ptc ON tc.id = ptc.cluster_id
      GROUP BY tc.id
      ORDER BY tc.name ASC
    `);

    // Fetch all posts to allow mapping selection
    const [posts]: any = await pool.query('SELECT id, title FROM posts WHERE status = "published"');

    // For each cluster, fetch mapped post IDs
    for (const cluster of clusters) {
      const [mappings]: any = await pool.query('SELECT post_id FROM post_topic_clusters WHERE cluster_id = ?', [cluster.id]);
      cluster.postIds = mappings.map((m: any) => m.post_id);
    }

    return NextResponse.json({ clusters, posts });
  } catch (err: any) {
    console.error('GET Topic Clusters error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch topic clusters' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug, description, postIds } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO topic_clusters (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );

    const clusterId = result.insertId;

    // Insert post mappings if any
    if (Array.isArray(postIds) && postIds.length > 0) {
      for (const postId of postIds) {
        await pool.query('INSERT IGNORE INTO post_topic_clusters (post_id, cluster_id) VALUES (?, ?)', [postId, clusterId]);
      }
    }

    return NextResponse.json({ success: true, id: clusterId });
  } catch (err: any) {
    console.error('POST Topic Cluster error:', err.message);
    return NextResponse.json({ error: 'Failed to create topic cluster' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, slug, description, postIds } = await req.json();
    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'ID, name, and slug are required' }, { status: 400 });
    }

    await pool.query(
      'UPDATE topic_clusters SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description || null, id]
    );

    // Sync post mappings: delete old ones first
    await pool.query('DELETE FROM post_topic_clusters WHERE cluster_id = ?', [id]);
    
    if (Array.isArray(postIds) && postIds.length > 0) {
      for (const postId of postIds) {
        await pool.query('INSERT IGNORE INTO post_topic_clusters (post_id, cluster_id) VALUES (?, ?)', [postId, id]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PUT Topic Cluster error:', err.message);
    return NextResponse.json({ error: 'Failed to update topic cluster' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM topic_clusters WHERE id = ?', [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE Topic Cluster error:', err.message);
    return NextResponse.json({ error: 'Failed to delete topic cluster' }, { status: 500 });
  }
}
