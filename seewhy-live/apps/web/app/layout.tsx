import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SeeWhy LIVE — Create, Stream, Earn',
    template: '%s | SeeWhy LIVE',
  },
  description:
    'SeeWhy LIVE by SwanyThree EntTech — The next-generation live streaming platform for creators. Multi-guest rooms, AI transcription, 90% revenue share, and simultaneous multi-platform streaming.',
  keywords: ['live streaming', 'creator platform', 'multi-guest stream', 'RTMP', 'revenue share', 'SwanyThree'],
  authors: [{ name: 'SwanyThree EntTech' }],
  creator: 'SwanyThree EntTech',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://seewhylive.com',
    siteName: 'SeeWhy LIVE',
    title: 'SeeWhy LIVE — Create, Stream, Earn',
    description: 'The next-gen creator platform with 90% revenue share, multi-guest rooms & AI transcription.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SeeWhy LIVE — Create, Stream, Earn',
    description: 'The next-gen creator platform with 90% revenue share.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://seewhylive.com'),
};

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
