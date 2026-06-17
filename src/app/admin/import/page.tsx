import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ImportClientUI from './import-client';

export const metadata = { title: 'Import WordPress' };

export default async function ImportPage() {
  const session = await getSession();
  if (!session || (session.role !== 'Super Admin' && !session.permissions?.includes('manage_settings'))) {
    redirect('/admin');
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WordPress Importer</h1>
        <p className="text-slate-500 text-sm">Fetch, preview, and cleanly import posts, categories, and users from any WP REST API without timeouts.</p>
      </div>
      <ImportClientUI />
    </div>
  );
}
