import type { Metadata } from "next";
import { Nunito, Amatic_SC, Noto_Sans_Bengali } from "next/font/google";
import { Suspense } from "react";
import { ConditionalLayout } from '@/components/conditional-layout'
import { GlobalOverlays } from '@/components/global-overlays'
import { OrganizationStructuredData, WebsiteStructuredData } from '@/components/structured-data'
import { Toaster } from '@/components/ui/sonner'
import { FacebookPixel } from '@/components/FacebookPixel'
import { PHProvider } from '@/components/posthog-provider'
import { AuthProvider } from '@/components/auth-provider'
import { FloatingSupport } from '@/components/floating-support'
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
});

const amatic = Amatic_SC({
  variable: "--font-amatic",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: 'swap',
  preload: false,
  fallback: ['cursive', 'sans-serif'],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
});

// Viewport configuration (including themeColor as per Next.js 15)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover' as const, // Safe area support for notched devices
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#14B8A6' },
    { media: '(prefers-color-scheme: dark)', color: '#0D9488' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://kidstoysbangladesh.com'),
  title: {
    default: "Best Kids Toys Online Store in Bangladesh",
    template: "%s | KidsToysBangladesh"
  },
  description: "Discover the best collection of kids toys in Bangladesh. Safe, educational, and fun toys for children of all ages. Fast delivery across Bangladesh with cash on delivery.",
  keywords: ["kids toys", "children toys", "toys Bangladesh", "educational toys", "baby toys", "toy store", "kids games", "children gifts"],
  authors: [{ name: "KidsToysBangladesh" }],
  creator: "KidsToysBangladesh",
  publisher: "KidsToysBangladesh",
  // Apple Web App configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KidsToys BD',
  },
  // Format detection
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    url: 'https://kidstoysbangladesh.com',
    siteName: 'KidsToysBangladesh',
    title: 'KidsToysBangladesh - Best Kids Toys Online Store in Bangladesh',
    description: 'Discover the best collection of kids toys in Bangladesh. Safe, educational, and fun toys for children of all ages.',
    images: [
      {
        url: 'https://kidstoysbangladesh.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KidsToysBangladesh - Kids Toys Store',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@kidstoysBD',
    creator: '@kidstoysBD',
    title: 'KidsToysBangladesh - Best Kids Toys Online Store',
    description: 'Discover the best collection of kids toys in Bangladesh. Safe, educational, and fun toys for children of all ages.',
    images: ['https://kidstoysbangladesh.com/og-image.png'],
  },

  category: 'shopping',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Performance preconnects for critical third-parties */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://us.i.posthog.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://us.i.posthog.com" />
        <link rel="preconnect" href="https://us-assets.i.posthog.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://us-assets.i.posthog.com" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <OrganizationStructuredData />
        <WebsiteStructuredData />
        <meta name="google-site-verification" content="6DJ_1MrTl9d74WV42luKp3HRmdWfHZOh1OfHY-9thFs" />
      </head>
      <body
        className={`${nunito.variable} ${amatic.variable} ${notoSansBengali.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <PHProvider>
            {/* Wrap components using navigation hooks in Suspense */}
            <Suspense fallback={null}>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </Suspense>
            {/* Overlays rendered at the end of body to avoid stacking issues */}
            <GlobalOverlays />
            <Toaster />
            <FloatingSupport />
            <Suspense fallback={null}>
              <FacebookPixel />
            </Suspense>
          </PHProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
