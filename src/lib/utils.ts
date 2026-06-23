import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the base-path prefix for the app (e.g. '/blog' or '').
 * Derived from NEXT_PUBLIC_APP_URL at runtime, matching the basePath in next.config.ts.
 * Use this for plain HTML <form action> attributes that Next.js doesn't rewrite automatically.
 */
export function getBasePath(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  try {
    const { pathname } = new URL(appUrl);
    const p = pathname.replace(/\/$/, '');
    return p === '' ? '' : p;
  } catch {
    return '';
  }
}
