/**
 * Theme utility — converts a hex brand color to a CSS :root override block.
 *
 * Works on both server and client (pure math, zero imports).
 *
 * Strategy:
 *   1. Convert hex → linear RGB → OKLab → OKLCH to extract the hue (H).
 *   2. Rebuild a full orange-scale using fixed lightness/chroma values but
 *      the user's hue — this makes every `bg-orange-*`, `text-orange-*`,
 *      `border-orange-*` Tailwind class in the app automatically reflect
 *      the chosen color (Tailwind v4 exposes colors as CSS variables).
 *   3. Also override the shadcn/ui semantic tokens (--primary, --ring, --accent,
 *      --sidebar-primary, etc.) so shadcn components follow the new color too.
 */

function hexToRgbLinear(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return null;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  const linearize = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  return [linearize(r), linearize(g), linearize(b)];
}

function linearRgbToOklchHue(lr: number, lg: number, lb: number): number {
  // RGB → LMS (cube root compressed)
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  // LMS → OKLab a/b channels
  const a  =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const H = Math.atan2(bv, a) * (180 / Math.PI);
  return H < 0 ? H + 360 : H;
}

/**
 * Returns a CSS string that overrides `:root` with the chosen brand hue.
 * Returns empty string when `brandHex` is falsy or invalid (CSS defaults apply).
 */
export function generateThemeStyle(brandHex: string): string {
  if (!brandHex) return '';

  const rgb = hexToRgbLinear(brandHex);
  if (!rgb) return '';

  const hue = linearRgbToOklchHue(...rgb);
  const H   = hue.toFixed(3);

  // ── Tailwind v4 orange scale (keeps all bg-orange-*, text-orange-*, etc.) ──
  // Lightness/chroma values mirror Tailwind's built-in orange palette shape.
  const orangeScale: [string, string, string][] = [
    ['50',  '0.970', '0.013'],
    ['100', '0.940', '0.038'],
    ['200', '0.888', '0.073'],
    ['300', '0.822', '0.132'],
    ['400', '0.749', '0.192'],
    ['500', '0.665', '0.222'],
    ['600', '0.580', '0.219'],
    ['700', '0.497', '0.195'],
    ['800', '0.412', '0.160'],
    ['900', '0.345', '0.121'],
    ['950', '0.228', '0.082'],
  ];

  const lines: string[] = [':root {'];

  // Tailwind color token overrides
  for (const [shade, l, c] of orangeScale) {
    lines.push(`  --color-orange-${shade}: oklch(${l} ${c} ${H});`);
  }

  // Shadcn/ui semantic token overrides
  lines.push(`  --primary:                   oklch(0.71 0.21 ${H});`);
  lines.push(`  --primary-foreground:        oklch(0.99 0    0);`);
  lines.push(`  --ring:                      oklch(0.71 0.21 ${H});`);
  lines.push(`  --accent:                    oklch(0.97 0.02 ${H});`);
  lines.push(`  --accent-foreground:         oklch(0.60 0.20 ${H});`);
  lines.push(`  --sidebar-primary:           oklch(0.71 0.21 ${H});`);
  lines.push(`  --sidebar-primary-foreground:oklch(0.99 0    0);`);
  lines.push(`  --sidebar-accent:            oklch(0.97 0.02 ${H});`);
  lines.push(`  --sidebar-accent-foreground: oklch(0.60 0.20 ${H});`);
  lines.push(`  --sidebar-ring:              oklch(0.71 0.21 ${H});`);
  lines.push(`  --chart-1:                   oklch(0.71 0.21 ${H});`);
  lines.push('}');

  return lines.join('\n');
}

/** Preset brand colors shown in the admin settings palette. */
export const THEME_PRESETS = [
  { name: 'Orange',  hex: '#f97316' }, // default
  { name: 'Amber',   hex: '#f59e0b' },
  { name: 'Rose',    hex: '#f43f5e' },
  { name: 'Violet',  hex: '#8b5cf6' },
  { name: 'Indigo',  hex: '#6366f1' },
  { name: 'Sky',     hex: '#0ea5e9' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal',    hex: '#14b8a6' },
  { name: 'Slate',   hex: '#64748b' },
] as const;
