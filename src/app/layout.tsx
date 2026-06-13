import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { settingsService } from "@/modules/settings";
import { generateThemeStyle } from "@/lib/theme";
import { generateTypographyStyle, DEFAULT_TYPOGRAPHY, TypographySettings } from "@/lib/typography";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dynamic Root Metadata Generator
export async function generateMetadata(): Promise<Metadata> {
  let settings: Record<string, string> = {};
  try {
    settings = await settingsService.getSettings();
  } catch (e) {
    console.error('Error fetching settings for metadata:', e);
  }

  const siteTitle = settings.site_name || settings.site_title || 'Blog';
  const siteDescription = settings.site_description || 'Next generation SaaS content platform.';
  const defaultMetaTitle = settings.default_meta_title || siteTitle;
  const defaultMetaDescription = settings.default_meta_description || siteDescription;
  const robotsSettings = settings.meta_robots_indexing || 'index, follow';
  const socialOgImage = settings.social_og_image || '/images/default-blog.jpg';
  const socialTwitterCard = settings.social_twitter_card || 'summary_large_image';

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const metadataBase = new URL(siteUrl);

  return {
    metadataBase,
    title: {
      default: defaultMetaTitle,
      template: `%s | ${siteTitle}`,
    },
    description: defaultMetaDescription,
    alternates: {
      canonical: './',
    },
    openGraph: {
      title: defaultMetaTitle,
      description: defaultMetaDescription,
      images: [{ url: socialOgImage }],
      url: './',
    },
    twitter: {
      card: socialTwitterCard as any,
      title: defaultMetaTitle,
      description: defaultMetaDescription,
      images: [socialOgImage],
    },
    other: {
      robots: robotsSettings,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings from DB (gracefully fall back if DB unavailable)
  let themeStyle = '';
  let typographyStyle = '';
  let headerScripts = '';
  let footerScripts = '';
  let gaId = '';
  
  let orgSchema: any = null;
  let webSchema: any = null;

  try {
    const brandColor = await settingsService.getBrandColor();
    themeStyle = generateThemeStyle(brandColor);

    const typographyRaw = await settingsService.getSetting('typography_settings');
    const typographySettings: TypographySettings = typographyRaw
      ? JSON.parse(typographyRaw)
      : DEFAULT_TYPOGRAPHY;
    typographyStyle = generateTypographyStyle(typographySettings);

    headerScripts = await settingsService.getHeaderScripts();
    footerScripts = await settingsService.getFooterScripts();
    gaId = await settingsService.getGoogleAnalyticsId();

    const settings = await settingsService.getSettings();
    if (settings.org_schema_name) {
      let socialArray = [];
      try {
        socialArray = JSON.parse(settings.org_schema_social || '[]');
      } catch {}
      orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: settings.org_schema_name,
        logo: settings.org_schema_logo || undefined,
        sameAs: socialArray,
      };
    }

    if (settings.web_schema_name) {
      webSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: settings.web_schema_name,
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      };
    }
  } catch (err) {
    console.error('Error loading RootLayout configuration database tags:', err);
    // DB unavailable during build/cold start — default fonts apply
    typographyStyle = generateTypographyStyle(DEFAULT_TYPOGRAPHY);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inject brand color overrides before any content renders — zero flicker */}
        {themeStyle && (
          <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        )}
        {typographyStyle && (
          <style dangerouslySetInnerHTML={{ __html: typographyStyle }} />
        )}
        
        {/* Google Analytics */}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
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

        {/* JSON-LD Org Schema */}
        {orgSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
        )}

        {/* JSON-LD WebSite Schema */}
        {webSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webSchema) }}
          />
        )}

        {/* Custom Head Scripts */}
        {headerScripts && (
          <div dangerouslySetInnerHTML={{ __html: headerScripts }} />
        )}
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* Custom Footer Scripts */}
        {footerScripts && (
          <div dangerouslySetInnerHTML={{ __html: footerScripts }} />
        )}
      </body>
    </html>
  );
}
