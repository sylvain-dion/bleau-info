'use client'

import { useTheme } from '@/lib/hooks/use-theme'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    // Cycle: system → light → dark → system
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex h-12 w-12 items-center justify-center rounded-lg bg-transparent text-zinc-900 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-zinc-600"
      aria-label="Toggle theme"
      title={`Current: ${theme} (${resolvedTheme})`}
    >
      {resolvedTheme === 'dark' ? (
        <Moon className="h-5 w-5 transition-transform duration-300" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-300" />
      )}
    </button>
  )
}
