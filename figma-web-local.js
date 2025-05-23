const { Builder, By, until } = require('selenium-webdriver');
const { smartuiSnapshot } = require('@lambdatest/selenium-driver');

(async function example() {
    let driver = await new Builder().forBrowser("chrome").build();
    await driver.manage().window().maximize();
    const actions = driver.actions({ bridge: true });

    const ss2options = {
        web: {
            browsers: ["chrome"],
            viewports: [[1400,800]], //required resized dom viewport
            fullPage: [true] // <-- This enables full page screenshot
        }
    }

    // Search Activation
    //1. open the MK home page
    const SearchActivsation = {
        "web": {
            "browsers": [
                "chrome"
            ],
            "viewports": [
                [1440,800]
            ], //required resized dom viewport
            "fullPage": [true] // <-- This enables full page screenshot
        }
    };

    const fullPageOptions = {
        web: {
            browsers: ["chrome"],
            viewports: [[1440,800]],
            fullPage: [true]
        }
    };

    async function acceptCookies() {
        try {
            const cookieBtn = await driver.wait(until.elementLocated(By.id("onetrust-accept-btn-handler")), 10000);
            await cookieBtn.click();
            await driver.sleep(3000);
        } catch (err) {
            console.warn("Cookie button not found or already accepted.");
        }
    }

    async function scrollPage() {
        await driver.executeScript(`
            return new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        `);
        await driver.sleep(3000);
        await driver.executeScript("window.scrollTo(0, 0)");
        await driver.sleep(3000);
    }

    async function hideMainContent() {
        await driver.executeScript(`
            const mainContentElement = document.getElementById('maincontent');
            if (mainContentElement) {
                mainContentElement.style.display = 'none';
            }
        `);
    }

    async function showMainContent() {
        await driver.executeScript(`
            const mainContentElement = document.getElementById('maincontent');
            if (mainContentElement) {
                mainContentElement.style.display = 'block';
            }
        `);
    }

    async function captureSnapshot(snapshotName, options = SearchActivsation) {
        //await hideMainContent();
        await smartuiSnapshot(driver, snapshotName, fullPageOptions);
        await showMainContent();
        await driver.sleep(3000);
    }

    async function runScenario(searchText, snapshotName, snapshotOptions = SearchActivsation) {
        await driver.get("https://storefront:MK2022@uat.michaelkors.co.uk/");
        await driver.sleep(25000);
        await acceptCookies();
        try {
            const closeBtn = await driver.findElement(By.xpath("(//*[@class='c-icon m-close'])[2]"));
            await closeBtn.click();
        } catch (e) {
            console.log("No close button found.");
        }
        await scrollPage();
        await driver.executeScript(`
            const el = document.querySelector('[aria-label="Search"]');
            if (el) el.click();
        `);
        await driver.sleep(3000);
        await driver.sleep(3000);
        const searchInput = await driver.wait(until.elementLocated(By.id("site-search")), 10000);
        await searchInput.sendKeys(searchText);
        await driver.sleep(20000);
        await captureSnapshot(snapshotName, fullPageOptions);
    }

    try {
        // Scenario 1: Valid Search
        await runScenario("Totes", "Initial Search View.png");

        // Scenario 2: Gibberish
        await runScenario("tewhgat", "Initial Gibbrish Search View.png");

    } catch (err) {
        console.error("Error occurred:", err);
    } finally {
        await driver.quit();
    }
})();
