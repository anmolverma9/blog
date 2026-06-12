import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { settingsService } from '@/modules/settings';
import { DEFAULT_TYPOGRAPHY } from '@/lib/typography';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const typographyRaw = await settingsService.getSetting('typography_settings');
    const settings = typographyRaw ? JSON.parse(typographyRaw) : DEFAULT_TYPOGRAPHY;
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error('Admin GET typography settings error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const settings = await req.json();
    if (typeof settings !== 'object' || settings === null) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }

    await settingsService.saveSetting('typography_settings', JSON.stringify(settings));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin POST typography settings error:', err.message);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
