import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { mediaService } from '@/modules/media';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { alt_text, title_text } = await req.json();

    const success = await mediaService.updateMetadata(mediaId, alt_text, title_text);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update metadata' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin PUT media metadata error:', err.message);
    return NextResponse.json({ error: 'Failed to update media metadata' }, { status: 500 });
  }
}
