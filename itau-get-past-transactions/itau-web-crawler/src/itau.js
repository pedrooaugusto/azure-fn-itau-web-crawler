/* Functions to manipulate Itau Internet Banking site */

const Scrape = require('./scrape');
const moment = require('moment');
const Transactions = require('./transactions');
const { STYLE } = require('./utils');

class Itau {

    constructor () {
        this.scrape = new Scrape();
        this.periods = [];

        const dateStart = moment('2018-01-01');
        const dateEnd = moment();

        while (dateEnd > dateStart || dateStart.format('M') === dateEnd.format('M')) {
            this.periods.push(dateStart.format('MM/YYYY'));
            dateStart.add(1, 'month');
        }

        const s = this.periods.length;
        console.log('[INFO] ' + s + ' months (' + this.periods[0] + ', ' + this.periods[s - 1] + ')');
    }

    async createPage (browser, createIfNotExist = true) {
        console.log('[INFO] Searching for active itau tab...');

        const pages = await browser.pages();
        let page = pages.find(a => a.url().match(new RegExp('itau', 'gi')));

        if (!page) {            
            console.log('[INFO] Not Found, creating new Itau page');

            page = await browser.newPage();
            await page.goto('https://www.itau.com.br/');
        }

        page.setDefaultTimeout(60000)

        return page;
    }

    async logIn (page, credentials) {
        console.log('[INFO] Log in at '+page.url());

        await page.focus('input#agencia');
        await page.keyboard.type(credentials.AGENCIA);
        await page.focus('input#conta');
        await page.keyboard.type(credentials.CONTA);
        await page.waitFor(1000);
        await page.keyboard.press('Enter');
        await page.waitFor(5000);
        console.log('[INFO] Waiting for form#frmKey');
        await page.waitForSelector('form#frmKey');
    }

    async virtualKeyboard (page, credentials) {
        console.log('[INFO] Bypassing virtual keyboard');

        const keys = await page.evaluate((pass) => {
            const vk = Array.from(document.querySelectorAll('.teclas a.campoTeclado'));
            
            return pass
                .map(a => vk.find(b => b.getAttribute('aria-label').match(new RegExp(a, 'gi'))))
                .filter(a => (a !== undefined && a !== null))
                .map(a => a.getAttribute('aria-label'));
            
        }, credentials.IBPASS.split(''));

        // if (!process.env.PRODUCTION) console.log(keys);

        // Typing password
        for (const key of keys) {
            await page.click('.teclas a.campoTeclado[aria-label="' + key + '"]');
            await page.waitFor(1000);
        }

        await page.click('.teclado a.btn-teclado-login');
        await page.waitForSelector('#saldo');
    }

    async getTransactions (page, query = { desc: 'existence*', fn: () => true }) {
        console.log('[INFO] Fetching all transactions that satiesfy: ' + query.desc);

        const transactions = [];

        for (const period of this.periods) {
            if (!query.fn('02/'+ period, false)) {
                console.log('[INFO] Skiping ' + period + '...');
                continue;
            }

            console.log('[INFO] ' + period + '...');

            const t1 = new Date().getTime();
            const res = await this.scrape.transactions(page, period, query);

            transactions.push(res);

            console.log(
                STYLE.Bright +
                `[INFO] √ (${period}): ${res.length} transactions in ${(new Date().getTime() - t1)}ms !` +
                STYLE.Reset
            );

            await page.waitFor(2000);
        }

        console.log(STYLE.fg.Green + '[INFO] Success!' + STYLE.Reset);

        return new Transactions(transactions, query.fn);
    }

    async transactionsHistory (page) {
        console.log('[INFO] Going to transactions list page');
        await page.click('.botoes a');
        await page.waitFor(10000);
    }

    async checkForBanners (page) {
        console.log('[INFO] Searching for any banner blocking the UI');
        const banner = await page.$('.mfp-wrap');
        
        if (banner) {
            console.log('[INFO] Closing the banner');
            await page.evaluate(() => {
                $('.mfp-wrap .mfp-close').click()
            });
        }
    }

}

module.exports = Itau;