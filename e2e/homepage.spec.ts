import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads with the correct title
    await expect(page).toHaveTitle(/Bleau.info/)
  })

  test('should display the main heading', async ({ page }) => {
    await page.goto('/')

    // Check that the main heading is visible
    const heading = page.getByRole('heading', { name: /Bleau\.info/ })
    await expect(heading).toBeVisible()
  })

  test('should have touch-friendly buttons (min 48x48px)', async ({ page }) => {
    await page.goto('/')

    // Check that buttons meet minimum touch target size
    const exploreButton = page.getByRole('button', { name: /Explorer la carte/ })
    const loginButton = page.getByRole('button', { name: /Se connecter/ })

    await expect(exploreButton).toBeVisible()
    await expect(loginButton).toBeVisible()

    // Verify minimum touch target size (48px)
    const exploreBox = await exploreButton.boundingBox()
    const loginBox = await loginButton.boundingBox()

    expect(exploreBox?.height).toBeGreaterThanOrEqual(48)
    expect(exploreBox?.width).toBeGreaterThanOrEqual(48)
    expect(loginBox?.height).toBeGreaterThanOrEqual(48)
    expect(loginBox?.width).toBeGreaterThanOrEqual(48)
  })

  test('should display development status message', async ({ page }) => {
    await page.goto('/')

    // Check that the development status is visible
    const statusMessage = page.getByText(/Application en cours de développement/)
    await expect(statusMessage).toBeVisible()
  })
})
