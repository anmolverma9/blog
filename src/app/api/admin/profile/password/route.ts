import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { current_password, new_password, confirm_password } = await req.json();

    if (!current_password || !new_password || !confirm_password) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
    }

    if (new_password.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    if (new_password !== confirm_password) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    // Fetch stored hash
    const [rows]: any = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [session.id]
    );
    const user = rows[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Verify current password
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, session.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Password change error:', err.message);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
