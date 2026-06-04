import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { redirectService } from '@/modules/redirects';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const redId = Number(id);
  if (isNaN(redId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { old_url, new_url, status_code } = body;

    const updateData: any = {};
    if (old_url !== undefined) updateData.old_url = old_url;
    if (new_url !== undefined) updateData.new_url = new_url;
    if (status_code !== undefined) updateData.status_code = Number(status_code);

    await redirectService.updateRedirect(redId, updateData);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin PUT redirect error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update redirect' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const redId = Number(id);
  if (isNaN(redId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await redirectService.deleteRedirect(redId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE redirect error:', err.message);
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 });
  }
}
