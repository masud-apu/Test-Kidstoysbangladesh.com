import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import { Header } from '@/components/header'
import { OrganizationStructuredData, WebsiteStructuredData } from '@/components/structured-data'
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
});

export const metadata: Metadata = {
  title: {
    default: "KidsToysBangladesh - Best Kids Toys Online Store in Bangladesh",
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
        url: 'https://kidstoysbangladesh.com/og-image.jpg',
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
    images: ['https://kidstoysbangladesh.com/og-image.jpg'],
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
      </head>
      <body
        className={`${inter.variable} ${notoSansBengali.variable} font-sans antialiased`}
      >
        <Header />
        <main className="pt-16 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
