import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { softwareService } from '@/modules/software';
import SoftwareReviews from '@/components/public/software-reviews';
import { Star, ExternalLink, ArrowLeft, Landmark, CreditCard, Sparkles } from 'lucide-react';

interface SoftwarePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

export async function generateMetadata({ params }: SoftwarePageProps) {
  try {
    const { slug } = await params;
    const item = await softwareService.getListingBySlug(slug);
    if (!item) return {};

    return {
      title: `${item.name} | SaaS Software Directory`,
      description: item.tagline || item.description.slice(0, 160),
      other: {
        robots: 'index, follow',
      }
    };
  } catch (e) {
    console.error('Error generating metadata for software page:', e);
    return {};
  }
}

export default async function SoftwareProfilePage({ params }: SoftwarePageProps) {
  const { slug } = await params;
  const item = await softwareService.getListingBySlug(slug);

  if (!item) {
    notFound();
  }

  // Load reviews from DB
  const reviews = await softwareService.getReviews(item.id!);

  return (
    <LayoutWrapper>
      <div className="editorial-container py-10 md:py-16 space-y-8 animate-in fade-in duration-300">
        
        {/* Back Link */}
        <div>
          <Link href="/software" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Software Directory
          </Link>
        </div>

        {/* Hero Card Profile */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
          {/* Decorative subtle gradient background */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-50 border flex items-center justify-center font-bold text-2xl text-slate-700 shrink-0 shadow-inner">
                {item.logo_url ? (
                  <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  item.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full w-fit">
                  {item.category_name || 'Utilities'}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {item.name}
                </h1>
                <p className="text-slate-500 text-xs md:text-sm font-semibold italic">
                  {item.tagline}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-50 border px-3 py-1.5 rounded-xl">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-slate-800">
                  {item.overall_rating ? Number(item.overall_rating).toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
              
              {item.website_url && (
                <a
                  href={item.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/10"
                >
                  Visit Website <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Listing Specs and Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 relative z-10">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Product Details
              </h3>
              <div className="prose prose-slate max-w-none text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                {item.description}
              </div>
            </div>

            <div className="md:col-span-1 bg-slate-50/50 border rounded-2xl p-5 space-y-4 h-fit">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Specifications</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" /> Pricing
                  </span>
                  <span className="font-bold text-slate-800 uppercase bg-white border px-2 py-0.5 rounded">
                    {item.pricing_model}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5" /> Category
                  </span>
                  <span className="font-bold text-slate-800">
                    {item.category_name || 'Utilities'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <SoftwareReviews softwareId={item.id!} initialReviews={reviews} />

      </div>
    </LayoutWrapper>
  );
}
