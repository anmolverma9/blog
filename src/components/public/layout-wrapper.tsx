import React from 'react';
import Navbar from './navbar';
import Footer from './footer';
import { settingsService } from '@/modules/settings';
import { menuService } from '@/modules/menus';
import { postService } from '@/modules/posts';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default async function LayoutWrapper({ children }: LayoutWrapperProps) {
  // Load dynamic settings
  const settings = await settingsService.getSettings();
  const siteName = settings.site_name || 'Blog';
  const siteLogo = settings.site_logo || '';
  const siteDescription = settings.site_description || 'Next generation advertising platform.';
  const gaId = settings.google_analytics_id || '';
  const headerScripts = settings.header_scripts || '';
  const footerScripts = settings.footer_scripts || '';

  // Load dynamic menus
  const headerMenu = await menuService.getMenuBySlug('header');
  const menuItems = headerMenu?.items || [];

  const footerQuickMenu = await menuService.getMenuBySlug('footer_quick_links');
  const footerQuickItems = footerQuickMenu?.items || [];

  const footerLegalMenu = await menuService.getMenuBySlug('footer_legal');
  const footerLegalItems = footerLegalMenu?.items || [];

  // Fetch latest post for breaking news ticker
  let breakingNewsTitle = 'Why Social Media Marketing Matters for Modern Business Growth';
  try {
    const { posts: latest } = await postService.getPosts({ status: 'published', limit: 1 });
    if (latest && latest.length > 0) {
      breakingNewsTitle = latest[0].title;
    }
  } catch (err) {
    console.error('Failed to fetch breaking news:', err);
  }

  return (
    <>
      {/* 1. Header Scripts Injections */}
      {headerScripts && (
        <span
          dangerouslySetInnerHTML={{ __html: headerScripts }}
          style={{ display: 'none' }}
        />
      )}

      {/* Google Analytics GA4 integration */}
      {gaId && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `,
            }}
          />
        </>
      )}

      {/* Navigation Bar */}
      <Navbar siteName={siteName} siteLogo={siteLogo} siteDescription={siteDescription} menuItems={menuItems} breakingNewsTitle={breakingNewsTitle} />

      {/* Main Workspace content */}
      <div className="flex-1 bg-slate-50/50 flex flex-col">
        {children}
      </div>

      {/* Footer Banner */}
      <Footer 
        siteName={siteName} 
        siteLogo={siteLogo} 
        siteDescription={siteDescription} 
        quickLinks={footerQuickItems}
        legalLinks={footerLegalItems}
      />

      {/* 2. Footer Scripts Injections */}
      {footerScripts && (
        <span
          dangerouslySetInnerHTML={{ __html: footerScripts }}
          style={{ display: 'none' }}
        />
      )}
    </>
  );
}
