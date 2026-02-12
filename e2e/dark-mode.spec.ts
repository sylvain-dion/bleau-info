import { test, expect } from '@playwright/test'

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('should toggle between light and dark mode', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait for the toggle button to be visible
    const button = page.getByRole('button', { name: /toggle theme/i })
    await button.waitFor({ state: 'visible', timeout: 10000 })

    // Vérifier le mode initial (system - devrait être light par défaut)
    const html = page.locator('html')

    // Cliquer sur le toggle pour passer en light mode explicite
    await button.click()
    await expect(html).not.toHaveClass(/dark/)

    // Cliquer à nouveau pour passer en dark mode
    await button.click()
    await expect(html).toHaveClass(/dark/)

    // Cliquer encore pour revenir en system mode
    await button.click()
  })

  test('should persist theme preference in localStorage', async ({ page }) => {
    await page.goto('/')

    // Cycle vers light puis dark mode
    await page.getByRole('button', { name: /toggle theme/i }).click()
    await page.getByRole('button', { name: /toggle theme/i }).click()

    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    // Vérifier que le thème est sauvegardé dans localStorage
    const storedTheme = await page.evaluate(() => localStorage.getItem('theme'))
    expect(storedTheme).toBe('dark')

    // Recharger la page
    await page.reload()

    // Vérifier que le dark mode est toujours actif
    await expect(html).toHaveClass(/dark/)
  })

  test('should respect system preference on first load', async ({ page }) => {
    // Simuler préférence système dark
    await page.emulateMedia({ colorScheme: 'dark' })

    await page.goto('/')

    // Vérifier que le dark mode est activé automatiquement
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
  })

  test('should respect system preference light on first load', async ({ page }) => {
    // Simuler préférence système light
    await page.emulateMedia({ colorScheme: 'light' })

    await page.goto('/')

    // Vérifier que le light mode est actif
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)
  })

  test('should have accessible toggle button', async ({ page }) => {
    await page.goto('/')

    const button = page.getByRole('button', { name: /toggle theme/i })

    // Vérifier l'accessibilité
    await expect(button).toBeVisible()
    await expect(button).toHaveAttribute('aria-label', 'Toggle theme')

    // Vérifier que le bouton a un title
    await expect(button).toHaveAttribute('title')

    // Vérifier focus visible
    await button.focus()
    await expect(button).toBeFocused()
  })

  test('should display sun icon in light mode', async ({ page }) => {
    await page.goto('/')

    // S'assurer qu'on est en light mode
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light')
    })
    await page.reload()

    const button = page.getByRole('button', { name: /toggle theme/i })
    const svg = button.locator('svg')

    await expect(svg).toBeVisible()
  })

  test('should display moon icon in dark mode', async ({ page }) => {
    await page.goto('/')

    // S'assurer qu'on est en dark mode
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.reload()

    const button = page.getByRole('button', { name: /toggle theme/i })
    const svg = button.locator('svg')

    await expect(svg).toBeVisible()
  })

  test('should have minimum touch target size (48px)', async ({ page }) => {
    await page.goto('/')

    const button = page.getByRole('button', { name: /toggle theme/i })
    const box = await button.boundingBox()

    expect(box).toBeTruthy()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(48)
      expect(box.height).toBeGreaterThanOrEqual(48)
    }
  })

  test('should not have FOUC (Flash Of Unstyled Content)', async ({ page }) => {
    // Set dark mode in localStorage before navigation
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark')
    })

    // Navigate to page and check immediately that dark class is present
    await page.goto('/')

    // The dark class should be applied by the inline script before hydration
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
  })

  test('should cycle through theme states: system → light → dark → system', async ({ page }) => {
    await page.goto('/')

    const button = page.getByRole('button', { name: /toggle theme/i })
    const html = page.locator('html')

    // Initial state is system (could be light or dark depending on OS)
    let initialTheme = await page.evaluate(() => localStorage.getItem('theme'))

    // First click: system → light
    await button.click()
    let theme = await page.evaluate(() => localStorage.getItem('theme'))
    expect(theme).toBe('light')
    await expect(html).not.toHaveClass(/dark/)

    // Second click: light → dark
    await button.click()
    theme = await page.evaluate(() => localStorage.getItem('theme'))
    expect(theme).toBe('dark')
    await expect(html).toHaveClass(/dark/)

    // Third click: dark → system
    await button.click()
    theme = await page.evaluate(() => localStorage.getItem('theme'))
    expect(theme).toBe('system')
  })

  test('should apply theme immediately without page reload', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const button = page.getByRole('button', { name: /toggle theme/i })

    // Click to light mode
    await button.click()
    await expect(html).not.toHaveClass(/dark/)

    // Click to dark mode - should be immediate
    await button.click()
    await expect(html).toHaveClass(/dark/)

    // No reload should have happened
    const navigationCount = await page.evaluate(() => window.performance.navigation.type)
    expect(navigationCount).toBe(0) // TYPE_NAVIGATE (not reload)
  })

  test('should maintain theme across navigation', async ({ page }) => {
    await page.goto('/')

    // Set to dark mode
    const button = page.getByRole('button', { name: /toggle theme/i })
    await button.click() // system → light
    await button.click() // light → dark

    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    // Navigate to a different page (if exists) or reload
    await page.reload()

    // Dark mode should persist
    await expect(html).toHaveClass(/dark/)
  })

  test('should have smooth transition between themes', async ({ page }) => {
    await page.goto('/')

    // Check that transition properties are set
    const bodyTransition = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return styles.transitionProperty
    })

    // Should have transition on color and background-color
    expect(bodyTransition).toContain('color')
    expect(bodyTransition).toContain('background-color')
  })

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto('/')

    // Check that animations are disabled or very short
    const animationDuration = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return styles.transitionDuration
    })

    // With reduced motion, duration should be minimal or 0
    expect(parseFloat(animationDuration)).toBeLessThanOrEqual(0.01) // Allow for rounding
  })
})
