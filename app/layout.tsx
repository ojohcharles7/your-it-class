import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AppChrome } from "@/components/app-chrome";
import { PwaManager } from "@/components/pwa/pwa-manager";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LearnHub — Learn tech skills that pay",
    template: "%s · LearnHub",
  },
  description:
    "Practical IT courses for Nigerian learners: programming, networking, cybersecurity, data, design and more. Video lessons, projects, exams and verifiable certificates.",
  keywords: [
    "IT courses Nigeria",
    "learn programming",
    "cybersecurity course",
    "CCTV installation training",
    "data analysis course",
    "online learning Nigeria",
  ],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: siteUrl,
    siteName: "LearnHub",
    title: "LearnHub — Learn tech skills that pay",
    description:
      "Video lessons, real projects, exams and verifiable certificates. Built for Nigerian learners.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnHub — Learn tech skills that pay",
    description: "Practical IT education for Nigerian learners.",
  },
  robots: { index: true, follow: true },
  applicationName: "LearnHub",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, title: "LearnHub", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/favicon-32.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2fc" },
    { media: "(prefers-color-scheme: dark)", color: "#070b16" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppChrome>{children}</AppChrome>
          <PwaManager />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
