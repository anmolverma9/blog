import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { settingsService } from "@/modules/settings";
import { generateThemeStyle } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppLuxe Blog",
  description: "AppLuxe — A modern content platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch the brand color from settings (gracefully fall back if DB unavailable)
  let themeStyle = '';
  try {
    const brandColor = await settingsService.getBrandColor();
    themeStyle = generateThemeStyle(brandColor);
  } catch {
    // DB unavailable during build/cold start — CSS defaults in globals.css apply
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Inject brand color overrides before any content renders — zero flicker */}
      {themeStyle && (
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      )}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
