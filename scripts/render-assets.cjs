// Renders scripts/icon.svg into the Expo icon, adaptive icon and splash PNGs.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const shot = async (file, size, inner, bg) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
    await page.screenshot({ path: path.join(__dirname, '..', 'assets', file), omitBackground: false });
  };
  await shot('icon.png', 1024, 1024, '#090E17');
  await shot('adaptive-icon.png', 1024, 680, '#090E17');
  await shot('splash.png', 1024, 560, '#090E17');
  await shot('favicon.png', 48, 48, '#090E17');
  await browser.close();
})();
