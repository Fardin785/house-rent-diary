import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log(`ERROR: ${msg.text()}`); });
  page.on('pageerror', err => console.log(`PAGE ERROR: ${err}`));

  await page.goto('http://localhost:5173/records');
  // click download PDF button on the first record we can find? The page may not load records immediately...
  // Let's just create a dummy react render that calls downloadPDF and observe its output!
  await browser.close();
})();
