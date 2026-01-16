/**
 * Script to capture screenshots for README
 * Uses Playwright to render the demo and capture different views
 */

import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const assetsDir = join(__dirname, '..', 'docs', 'assets')

const BASE_URL = 'http://localhost:5175/map-3d-deck/'

async function captureScreenshots() {
  console.log('Launching browser...')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
  })
  const page = await context.newPage()

  console.log('Navigating to demo...')
  await page.goto(BASE_URL)

  // Wait for map to load
  await page.waitForTimeout(3000)

  // Screenshot 1: Combined view (default state - all enabled)
  console.log('Capturing combined view...')
  await page.screenshot({ path: join(assetsDir, 'screenshot-combined.png') })

  // Screenshot 2: Zoning only (disable buildings and infra)
  console.log('Capturing zoning view...')
  // Click buildings button to disable
  const buildingsBtn = page.locator('button:has-text("Edifícios 3D")')
  if (await buildingsBtn.isVisible()) {
    await buildingsBtn.click()
    await page.waitForTimeout(500)
  }
  // Click infra button to disable
  const infraBtn = page.locator('button:has-text("Infraestrutura")')
  if (await infraBtn.isVisible()) {
    await infraBtn.click()
    await page.waitForTimeout(500)
  }
  await page.waitForTimeout(1000)
  await page.screenshot({ path: join(assetsDir, 'screenshot-zoning.png') })

  // Screenshot 3: Buildings view (enable buildings, keep infra off)
  console.log('Capturing buildings view...')
  await buildingsBtn.click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(assetsDir, 'screenshot-buildings.png') })

  // Screenshot 4: Infrastructure view (disable buildings, enable infra)
  console.log('Capturing infrastructure view...')
  await buildingsBtn.click()
  await page.waitForTimeout(500)
  await infraBtn.click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(assetsDir, 'screenshot-infrastructure.png') })

  await browser.close()
  console.log('Screenshots captured successfully!')
  console.log(`Saved to: ${assetsDir}`)
}

captureScreenshots().catch(console.error)
