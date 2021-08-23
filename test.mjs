import assert from 'assert';
import pti from 'puppeteer-to-istanbul';
import puppeteer from 'puppeteer';

describe('Test Coactivation Map', async () => {
  let browser, page;

  before(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();

    // Enable JS coverage
    await Promise.all([page.coverage.startJSCoverage()]);

    await page.goto('http://127.0.0.1:8080');
  });

  after(async () => {
    // Disable JavaScript coverage
    const jsCoverage = await page.coverage.stopJSCoverage();
    pti.write(jsCoverage, { includeHostname: true, storagePath: './.nyc_output' });
    await browser.close();
  });

  describe('Unit tests', () => {
    describe('Trivial test', () => {
      it('should say hey', async () => {
        await page.evaluate(() => window.location);
        assert.strictEqual("hey", "hey");
      });
    });
  });

  describe('End to end tests', () => {
    describe('Load a file', async () => {
      it('should display title', async () => {
        const title = await page.evaluate(() => document.title);
        assert.strictEqual(title, "Coactivation Map");
      });

      it('should display "Coactivation Map" in the home page', async () => {
        const msg = await page.evaluate(() => {
          const el = document.querySelector("#header > div:nth-child(2) > a > span");

          return el.innerText;
        });
        assert.strictEqual(msg, "Coactivation Map");
      });

      it('should display the correct colormap value', async () => {
        const msg = await page.evaluate(() => colormap(0));
        assert.deepStrictEqual(msg, [0, 0, 255, 255]);
      });

      it('should display the correct brainVoxel value', async () => {
        const msg = await page.evaluate(() => brainVoxel('sag', 0, 0));
        assert.strictEqual(msg, 12);
      });

      it('should drawTemplate without crashing', async () => {
        const msg = await page.evaluate(() => {
          try {
            drawTemplate();

            return true;
          } catch (err) {
            console.log(err);

            return false;
          }
        });
        assert.strictEqual(msg, true);
      });

      it('should display the default sagittal image');

      it('should display the corresponding MeSH terms');

      it('should change sagittal slice through the X target slider');

      it('should change to coronal plane');

      it('should be in the correct coordinate in the coronal plane');
    });
  });

});
