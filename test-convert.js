const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', exception => {
        console.log('PAGE ERROR:', exception.message);
    });

    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('Page loaded.');

    // Check if file input exists
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
        console.log('ERROR: No file input found on page!');
        // Print all inputs
        const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, id: e.id, name: e.name })));
        console.log('All inputs:', JSON.stringify(inputs));
        await browser.close();
        return;
    }
    console.log('File input found, uploading test image...');

    await page.setInputFiles('input[type="file"]', 'd:/vibecodingprojects/perler_beads_generator/test.png');
    console.log('Image uploaded, waiting 5 seconds for processing...');

    await page.waitForTimeout(5000);
    
    // Check canvas state
    const canvasInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { exists: false };
        return {
            exists: true,
            width: canvas.width,
            height: canvas.height,
            hidden: canvas.classList.contains('hidden'),
            display: getComputedStyle(canvas).display
        };
    });
    console.log('Canvas state:', JSON.stringify(canvasInfo));

    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
    console.log('Screenshot saved to test-screenshot.png');

    await browser.close();
    console.log('Done.');
})();
