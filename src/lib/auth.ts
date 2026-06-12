import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import pool from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_for_app_luxe_blog_platform_2026';
const COOKIE_NAME = 'appluxe_session';

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export async function signSession(user: { id: number; email: string; name: string; role_id: number }): Promise<string> {
  let role = 'Reader';
  let permissions: string[] = [];

  if (user.role_id === 1 || user.email === 'dscurlock@mail.com') {
    role = 'Super Admin';
    permissions = ['manage_all_content', 'manage_own_content', 'manage_users', 'manage_settings'];
  } else {
    try {
      const [rows]: any = await pool.query(
        `SELECT r.name as role_name, p.permission_key
         FROM roles r
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE r.id = ?`,
        [user.role_id]
      );
      role = rows[0]?.role_name || 'Reader';
      permissions = rows.map((r: any) => r.permission_key).filter(Boolean);
    } catch {
      // Graceful DB offline fallback
      role = 'Reader';
      permissions = [];
    }
  }

  const payload: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    permissions,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  
  // Set in cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    
    // Automatically force Super Admin for the main admin email (bypassing stale cookies)
    if (decoded && decoded.email === 'dscurlock@mail.com') {
      decoded.role = 'Super Admin';
      decoded.permissions = ['manage_all_content', 'manage_own_content', 'manage_users', 'manage_settings'];
    }

    return decoded;
  } catch (err) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function hasPermission(session: UserSession | null, permission: string): boolean {
  if (!session) return false;
  if (session.role === 'Super Admin') return true; // Super Admin has all permissions
  return session.permissions.includes(permission);
}
