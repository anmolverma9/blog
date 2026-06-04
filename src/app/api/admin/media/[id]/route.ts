import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { mediaService } from '@/modules/media';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const mediaId = Number(id);
  if (isNaN(mediaId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await mediaService.deleteMedia(mediaId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE media error:', err.message);
    return NextResponse.json({ error: 'Failed to delete media item' }, { status: 500 });
  }
}
