import type { Metadata } from "next";
import Script from 'next/script'
import { Raleway, Amatic_SC, Noto_Sans_Bengali } from "next/font/google";
import { ConditionalLayout } from '@/components/conditional-layout'
import { GlobalOverlays } from '@/components/global-overlays'
import { OrganizationStructuredData, WebsiteStructuredData } from '@/components/structured-data'
import { Toaster } from '@/components/ui/sonner'
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: 'swap',
});

const amatic = Amatic_SC({
  variable: "--font-amatic",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
});

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
  alternates: {
    canonical: 'https://kidstoysbangladesh.com',
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
        <OrganizationStructuredData />
        <WebsiteStructuredData />
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1214423220455445');
fbq('track', 'PageView');
          `}
        </Script>
        {/* End Meta Pixel Code */}
      </head>
      <body
        className={`${raleway.variable} ${amatic.variable} ${notoSansBengali.variable} font-sans antialiased`}
      >
        {/* Meta Pixel (noscript) */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1214423220455445&ev=PageView&noscript=1"
          />
        </noscript>
        <ConditionalLayout>
          {children}
  </ConditionalLayout>
  {/* Overlays rendered at the end of body to avoid stacking issues */}
  <GlobalOverlays />
  <Toaster />
      </body>
    </html>
  );
}
