import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { userService } from '@/modules/users';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await userService.getAllUsers();
    // Exclude password hashes from the return payload
    const sanitized = users.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });
    return NextResponse.json(sanitized);
  } catch (err: any) {
    console.error('API GET users error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, name, role_id, plainPassword, status, bio, avatar_id } = body;

    if (!email || !name || !role_id || !plainPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = await userService.createUser({
      email,
      name,
      role_id: Number(role_id),
      status: status || 'active',
      plainPassword,
    });

    if (bio !== undefined || avatar_id !== undefined) {
      await userService.updateAuthorByUserId(userId, {
        bio: bio || '',
        avatar_id: avatar_id ? Number(avatar_id) : null
      });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await userService.logActivity(session.id, 'create_user', `Created user account ${email} (${name})`, ip);

    return NextResponse.json({ success: true, id: userId });
  } catch (err: any) {
    console.error('API POST users error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, email, name, role_id, plainPassword, status, bio, avatar_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = Number(id);

    // Prevent privilege escalation: check if target is Super Admin
    const targetUser = await userService.getUser(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prohibit modifying own role to non-Super Admin if they are the logged in Super Admin
    if (userId === session.id && targetUser.role_name === 'Super Admin' && role_id !== undefined && Number(role_id) !== 1) {
      return NextResponse.json({ error: 'You cannot downgrade your own role from Super Admin' }, { status: 403 });
    }

    // Prohibit changing own status to suspended/inactive
    if (userId === session.id && status !== undefined && status !== 'active') {
      return NextResponse.json({ error: 'You cannot suspend or deactivate your own account' }, { status: 403 });
    }

    await userService.updateUser(userId, {
      email,
      name,
      role_id: role_id !== undefined ? Number(role_id) : undefined,
      status,
      plainPassword,
    });

    if (bio !== undefined || avatar_id !== undefined) {
      await userService.updateAuthorByUserId(userId, {
        bio: bio || '',
        avatar_id: avatar_id ? Number(avatar_id) : null
      });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await userService.logActivity(
      session.id,
      'update_user',
      `Updated user account ${email || targetUser.email} details`,
      ip
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API PUT users error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = Number(id);

    if (userId === session.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 });
    }

    const targetUser = await userService.getUser(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting a Super Admin if they are the primary one
    if (targetUser.role_name === 'Super Admin') {
      // Find all super admins
      const allUsers = await userService.getAllUsers();
      const superAdmins = allUsers.filter(u => u.role_name === 'Super Admin');
      if (superAdmins.length <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last remaining Super Admin' }, { status: 403 });
      }
    }

    await userService.deleteUser(userId);

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    await userService.logActivity(session.id, 'delete_user', `Deleted user account ${targetUser.email}`, ip);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API DELETE users error:', err.message);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
