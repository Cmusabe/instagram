import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CommandPalette } from "@/components/CommandPalette";
import { PageTracker } from "@/components/PageTracker";
import { HtmlLang } from "@/components/HtmlLang";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const url = "https://instaclean.nl";

export const metadata: Metadata = {
  title: "InstaClean \u2014 Annuleer al je Instagram Follow Requests",
  description: "Annuleer honderden Instagram follow requests in \u00e9\u00e9n keer. 100% gratis, veilig, en lokaal in je browser. Geen wachtwoord nodig.",
  keywords: [
    "instagram", "follow requests", "annuleren", "cancel", "pending", "unfollow",
    "instagram follow requests verwijderen", "pending requests opschonen",
    "instagram cleanup tool", "instagram unfollow bulk", "instagram opruimen",
  ],
  robots: "index, follow",
  alternates: {
    canonical: url,
    languages: {
      "nl": url,
      "en": `${url}/en`,
    },
  },
  openGraph: {
    title: "InstaClean \u2014 Annuleer al je Instagram Follow Requests",
    description: "Annuleer honderden Instagram follow requests in \u00e9\u00e9n keer. 100% gratis, veilig, en lokaal in je browser.",
    url,
    siteName: "InstaClean",
    type: "website",
    locale: "nl_NL",
    alternateLocale: "en_US",
    images: [{ url: `${url}/api/og`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "InstaClean", images: [`${url}/api/og`] },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "InstaClean",
    description: "Annuleer honderden Instagram follow requests in \u00e9\u00e9n keer. 100% gratis, veilig, en lokaal in je browser.",
    url,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    inLanguage: ["nl", "en"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    featureList: "Bulk follow request cancellation, Rate limit protection, Progress tracking, Resume capability",
  };

  return (
    <html lang="nl" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#07070D" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ background: "#07070D", color: "rgba(255,255,255,0.92)" }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:text-white" style={{ background: "linear-gradient(135deg, #D946EF, #8B5CF6)" }}>
          Skip to content
        </a>
        <Providers>
          <HtmlLang />
          <CommandPalette />
          <PageTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
