import { Onest } from 'next/font/google'

/**
 * Onest font configuration for the application
 * Weight 400 (Regular) for body text, 700 (Bold) for headings
 * Following UX-02 specification
 */
export const onest = Onest({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-onest',
  display: 'swap',
})
