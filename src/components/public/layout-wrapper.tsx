import React from 'react';
import Navbar from './navbar';
import Footer from './footer';
import { settingsService } from '@/modules/settings';
import { menuService } from '@/modules/menus';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default async function LayoutWrapper({ children }: LayoutWrapperProps) {
  // Load dynamic settings
  const settings = await settingsService.getSettings();
  const siteName = settings.site_name || 'Blog';
  const gaId = settings.google_analytics_id || '';
  const headerScripts = settings.header_scripts || '';
  const footerScripts = settings.footer_scripts || '';

  // Load header menu dynamically
  const headerMenu = await menuService.getMenuBySlug('header');
  const menuItems = headerMenu?.items || [];

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
      <Navbar siteName={siteName} menuItems={menuItems} />

      {/* Main Workspace content */}
      <div className="flex-1 bg-slate-50/50 flex flex-col">
        {children}
      </div>

      {/* Footer Banner */}
      <Footer siteName={siteName} />

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
