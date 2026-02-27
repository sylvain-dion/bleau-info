import { test, expect } from '@playwright/test'

test.describe('Homepage — Map view', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads with the correct title
    await expect(page).toHaveTitle(/Bleau.info/)
  })

  test('should display the header with app name', async ({ page }) => {
    await page.goto('/')

    // Check that the header is visible with the app name
    await expect(page.getByText('Bleau.info')).toBeVisible()
  })

  test('should render the map canvas', async ({ page }) => {
    await page.goto('/')

    // MapLibre renders into a canvas element
    const canvas = page.locator('canvas.maplibregl-canvas')
    await expect(canvas).toBeVisible({ timeout: 15000 })
  })

  test('should have map controls with touch-friendly buttons (min 48x48px)', async ({ page }) => {
    await page.goto('/')

    // Wait for map controls to appear
    const zoomIn = page.getByRole('button', { name: /zoomer/i })
    const zoomOut = page.getByRole('button', { name: /dézoomer/i })
    const locate = page.getByRole('button', { name: /me localiser/i })

    await expect(zoomIn).toBeVisible({ timeout: 10000 })
    await expect(zoomOut).toBeVisible()
    await expect(locate).toBeVisible()

    // Verify minimum touch target size (48px)
    const zoomInBox = await zoomIn.boundingBox()
    const locateBox = await locate.boundingBox()

    expect(zoomInBox?.height).toBeGreaterThanOrEqual(48)
    expect(zoomInBox?.width).toBeGreaterThanOrEqual(48)
    expect(locateBox?.height).toBeGreaterThanOrEqual(48)
    expect(locateBox?.width).toBeGreaterThanOrEqual(48)
  })

  test('should display theme toggle in the header', async ({ page }) => {
    await page.goto('/')

    const themeToggle = page.getByRole('button', { name: /thème/i })
    await expect(themeToggle).toBeVisible()
  })
})
