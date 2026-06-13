import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { userService } from '@/modules/users';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const roles = await userService.getRoles();
    const permissions = await userService.getPermissions();

    // Compile the permissions matrix
    const matrix: Record<number, string[]> = {};
    for (const r of roles) {
      matrix[r.id] = await userService.getRolePermissions(r.id);
    }

    return NextResponse.json({
      roles,
      permissions,
      matrix
    });
  } catch (err: any) {
    console.error('API GET roles error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch roles matrix' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { roleId, permissionKeys } = body;

    if (!roleId || !Array.isArray(permissionKeys)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const targetRoleId = Number(roleId);

    // Prevent modifying Super Admin role configuration
    if (targetRoleId === 1) {
      return NextResponse.json({ error: 'Super Admin permissions cannot be customized' }, { status: 403 });
    }

    await userService.updateRolePermissions(targetRoleId, permissionKeys);

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await userService.logActivity(
      session.id,
      'update_permissions',
      `Updated role permission mappings for role ID: ${targetRoleId}`,
      ip
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API POST roles matrix error:', err.message);
    return NextResponse.json({ error: 'Failed to update roles matrix' }, { status: 500 });
  }
}
