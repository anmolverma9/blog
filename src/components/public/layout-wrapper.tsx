import React from 'react';
import Navbar from './navbar';
import Footer from './footer';
import { settingsService } from '@/modules/settings';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default async function LayoutWrapper({ children }: LayoutWrapperProps) {
  // Load dynamic script injections from settings
  const gaId = await settingsService.getGoogleAnalyticsId();
  const headerScripts = await settingsService.getHeaderScripts();
  const footerScripts = await settingsService.getFooterScripts();

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
      <Navbar />

      {/* Main Workspace content */}
      <div className="flex-1 bg-slate-50/50 flex flex-col">
        {children}
      </div>

      {/* Footer Banner */}
      <Footer />

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
