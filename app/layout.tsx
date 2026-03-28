import type { Metadata, Viewport } from 'next'
import { onest } from '@/lib/fonts'
import { OfflineStatus } from '@/components/layout/offline-status'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { WeatherAlertsBell } from '@/components/layout/weather-alerts-bell'
import { AuthListener } from '@/components/auth/auth-listener'
import { UserMenu } from '@/components/auth/user-menu'
import { ToasterProvider } from '@/components/layout/toaster-provider'
import { SyncProvider } from '@/components/layout/sync-provider'
import Link from 'next/link'
import { Mountain } from 'lucide-react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bleau.info - Guide de Bloc à Fontainebleau',
  description: 'Application Progressive Web App pour explorer et contribuer aux blocs d\'escalade de Fontainebleau',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bleau Info',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Pre-load script to prevent FOUC (Flash Of Unstyled Content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'system';
                const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldBeDark = theme === 'dark' || (theme === 'system' && systemIsDark);
                if (shouldBeDark) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${onest.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-foreground">
              Bleau.info
            </Link>
            <Link
              href="/secteurs"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Mountain className="h-3.5 w-3.5" />
              Secteurs
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <WeatherAlertsBell />
            <UserMenu />
            <ThemeToggle />
          </div>
        </header>
        <AuthListener />
        <OfflineStatus />
        <SyncProvider />
        <ToasterProvider />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
