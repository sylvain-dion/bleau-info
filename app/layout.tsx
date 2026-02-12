import type { Metadata, Viewport } from 'next'
import { onest } from '@/lib/fonts'
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
      <body
        className={`${onest.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
