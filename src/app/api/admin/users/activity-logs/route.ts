import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { userService } from '@/modules/users';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const logs = await userService.getActivityLogs();
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error('API GET activity-logs error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
