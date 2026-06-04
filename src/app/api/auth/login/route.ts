import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/modules/users';
import { signSession } from '@/lib/auth';
import { isRateLimited } from '@/lib/security';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  // 1. Rate Limiting check (max 10 login attempts per minute per IP)
  if (isRateLimited(req, 10)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 2. Fetch user from DB
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 4. Sign JWT session
    await signSession({
      id: user.id!,
      email: user.email,
      name: user.name,
      role_id: user.role_id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role_name,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
  }
}
