const { chromium } = require('playwright');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'docs', 'assets');
const BASE_URL = 'http://localhost:5175/map-3d-deck/';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  await page.goto(BASE_URL);
  await page.waitForTimeout(4000);

  // Combined view (everything on by default)
  console.log('1. Combined view...');
  await page.screenshot({ path: path.join(assetsDir, 'screenshot-combined.png') });

  // Find buttons by their text content
  const buttons = await page.$$('button');
  let buildingsBtn = null;
  let infraBtn = null;

  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Edifícios') || text.includes('3D')) {
      buildingsBtn = btn;
    }
    if (text.includes('Infraestrutura') || text.includes('Infra')) {
      infraBtn = btn;
    }
  }

  // Zoning only - disable buildings and infra if they're on
  console.log('2. Zoning only...');
  if (buildingsBtn) {
    const isActive = await buildingsBtn.evaluate(el => el.classList.contains('active') || el.style.background?.includes('purple'));
    if (isActive) await buildingsBtn.click();
  }
  if (infraBtn) {
    const isActive = await infraBtn.evaluate(el => el.classList.contains('active'));
    if (isActive) await infraBtn.click();
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(assetsDir, 'screenshot-zoning.png') });

  // Buildings view
  console.log('3. Buildings view...');
  if (buildingsBtn) await buildingsBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(assetsDir, 'screenshot-buildings.png') });

  // Infrastructure view
  console.log('4. Infrastructure view...');
  if (buildingsBtn) await buildingsBtn.click();
  if (infraBtn) await infraBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(assetsDir, 'screenshot-infrastructure.png') });

  await browser.close();
  console.log('Done! Screenshots saved to:', assetsDir);
}

capture().catch(console.error);
