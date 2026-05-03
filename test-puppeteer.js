import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  await page.goto('http://localhost:5173/records');
  // wait a bit for react rendering
  await new Promise(r => setTimeout(r, 2000));
  
  // Find all buttons
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'PDF' || text === 'পিডিএফ (PDF)') {
      console.log("Clicking PDF button");
      await btn.click();
      await new Promise(r => setTimeout(r, 1000)); // wait for pdf process
      break;
    }
  }

  await browser.close();
})();
