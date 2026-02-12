import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * This is the standard Shadcn/UI utility for className handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
