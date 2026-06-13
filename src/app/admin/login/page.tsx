import LoginClient from './login-client';
import { settingsService } from '@/modules/settings';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  let siteName = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    siteName = settings.site_name || 'Blog';
  } catch {}

  return {
    title: `Admin Login | ${siteName} Platform`,
    description: `Log in to your ${siteName} CMS workspace.`,
  };
}

export default async function LoginPage() {
  let siteName = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    siteName = settings.site_name || 'Blog';
  } catch {}

  return <LoginClient siteName={siteName} />;
}

