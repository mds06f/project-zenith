/**
 * File: src/app/layout.tsx
 * Purpose: Root layout — fonts, metadata, global styles, provider boundary.
 * Responsibilities: load the display/body/mono typefaces via next/font and
 *   expose them as CSS variables consumed by tailwind.config.ts.
 */
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

// Cesium's CSS must be present for widgets/credits to render correctly.
import 'cesium/Build/Cesium/Widgets/widgets.css';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Project Zenith - The Celestial Lens',
  description: 'Point anywhere on Earth and instantly understand everything happening above you.',
};

export const viewport: Viewport = {
  themeColor: '#05060A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} dark`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
