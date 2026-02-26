import { test, expect } from '@playwright/test'

test.describe('Error Handling', () => {
  test('should load the app without error boundaries showing', async ({ page }) => {
    await page.goto('/')

    // Verify the app loads normally
    await expect(page.locator('h1')).toContainText('Bleau')

    // No error boundary text should be visible
    await expect(page.getByText(/une erreur est survenue/i)).not.toBeVisible()
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible()
  })

  test('should return 200 for the homepage', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })
})
