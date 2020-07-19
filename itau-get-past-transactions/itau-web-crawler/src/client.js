/**
 * Start chrome on dev mode: "
 * >> "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222
 * 
 * Then check: http://localhost:9222/json/version
 */

/* Puppeteer Options */
const centosurl = '/usr/bin/chromium-browser'
const winurl = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
const options = {
    executablePath: process.env.PRODUCTION ? centosurl : winurl,
    browserWSEndpoint: 'ws://localhost:9222/devtools/browser/73cd5297-61f1-43c0-8c06-7ef9dd458c6a',
    slowMo: 2000,
    viewPort: {
        width: 1366, 
        height: 768
    }
};

/* Helper functions to manipulate puppeteer/ */
class Client {

    newBrowserInstance (puppeteer, headless = true) {
        return puppeteer.launch({
            // executablePath: options.executablePath,
            headless,
            slowMo: options.slowMo,
            defaultViewport: options.viewPort,
            args: [`--window-size=${options.viewPort.width},${options.viewPort.height}`, '--no-sandbox', '--disable-setuid-sandbox'],
        });
    }

    async setEndPoint () {
        let res = "http://localhost:8080/test";
        res = await res.json();
        options.browserWSEndpoint = res.webSocketDebuggerUrl;
    }

    async existingBrowserInstance (puppeteer, headless = true) {
        await this.setEndPoint();

        return puppeteer.connect({
            browserWSEndpoint: options.browserWSEndpoint,
            slowMo: options.slowMo,
            headless,
            defaultViewport: options.viewPort
        });
    }

    async queryTab (term, browser) {
        const pages = await browser.pages();
        return pages.find(a => a.url().match(new RegExp(term, 'gi')));
    }

}

module.exports = new Client()