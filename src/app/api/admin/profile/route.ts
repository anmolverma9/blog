import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { userService } from '@/modules/users';
import pool from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await userService.getUser(session.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const author = await userService.getAuthorByUserId(session.id);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      status: user.status,
      bio: author?.bio || '',
      social_twitter: author?.social_twitter || '',
      social_facebook: author?.social_facebook || '',
      social_linkedin: author?.social_linkedin || '',
    });
  } catch (err: any) {
    console.error('Profile GET error:', err.message);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, bio, social_twitter, social_facebook, social_linkedin } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Update user name + email
    await userService.updateUser(session.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    // Update author profile (bio + socials)
    await userService.updateAuthorByUserId(session.id, {
      bio: bio?.trim() || '',
      social_twitter: social_twitter?.trim() || '',
      social_facebook: social_facebook?.trim() || '',
      social_linkedin: social_linkedin?.trim() || '',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Profile PATCH error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
