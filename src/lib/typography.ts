export interface FontSetting {
  type: 'google' | 'custom';
  name: string;
  url?: string;
  fallback: string;
}

export interface CustomFont {
  name: string;
  files: {
    woff2?: string;
    woff?: string;
    ttf?: string;
    otf?: string;
  };
}

export interface TypographySettings {
  headingFont: FontSetting;
  bodyFont: FontSetting;
  customFonts: CustomFont[];
}

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  headingFont: {
    type: 'google',
    name: 'Lexend Deca',
    url: 'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;500;600;700;800&display=swap',
    fallback: 'sans-serif'
  },
  bodyFont: {
    type: 'google',
    name: 'Outfit',
    url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
    fallback: 'sans-serif'
  },
  customFonts: []
};

export function generateTypographyStyle(settings: TypographySettings): string {
  const imports: string[] = [];
  const fontFaces: string[] = [];
  
  // 1. Process heading font
  if (settings.headingFont.type === 'google' && settings.headingFont.url) {
    imports.push(`@import url('${settings.headingFont.url}');`);
  }
  
  // 2. Process body font
  if (settings.bodyFont.type === 'google' && settings.bodyFont.url) {
    imports.push(`@import url('${settings.bodyFont.url}');`);
  }
  
  // 3. Process custom fonts
  if (settings.customFonts && settings.customFonts.length > 0) {
    for (const font of settings.customFonts) {
      const srcParts: string[] = [];
      if (font.files.woff2) srcParts.push(`url('${font.files.woff2}') format('woff2')`);
      if (font.files.woff) srcParts.push(`url('${font.files.woff}') format('woff')`);
      if (font.files.ttf) srcParts.push(`url('${font.files.ttf}') format('truetype')`);
      if (font.files.otf) srcParts.push(`url('${font.files.otf}') format('opentype')`);
      
      if (srcParts.length > 0) {
        fontFaces.push(`
@font-face {
  font-family: '${font.name}';
  src: ${srcParts.join(',\n       ')};
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`);
      }
    }
  }
  
  const headingFamily = `'${settings.headingFont.name}', ${settings.headingFont.fallback}`;
  const bodyFamily = `'${settings.bodyFont.name}', ${settings.bodyFont.fallback}`;
  
  const css = `
${imports.join('\n')}
${fontFaces.join('\n')}

:root {
  --font-heading: ${headingFamily};
  --font-sans: ${bodyFamily};
}

h1, h2, h3, h4, h5, h6, .font-heading {
  font-family: var(--font-heading) !important;
}

body, html, input, button, select, textarea, .font-sans {
  font-family: var(--font-sans) !important;
}
`;
  return css;
}
