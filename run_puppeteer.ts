import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Listen to browser console logs
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE: ${msg.type().toUpperCase()} - ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`BROWSER ERROR: ${err.message}`);
  });

  try {
    // Set cookie to bypass middleware login redirect
    await page.setCookie({
      name: 'kodelocal_staff_token',
      value: 'mock_token',
      domain: 'localhost',
      path: '/'
    });

    await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log("Navigation complete, waiting 5 seconds...");
    await new Promise(r => setTimeout(r, 5000));
  } catch (error) {
    console.error(`Script error: ${error}`);
  } finally {
    await browser.close();
  }
})();
