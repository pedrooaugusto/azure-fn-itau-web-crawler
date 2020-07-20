const puppeteer = require('puppeteer');
const Client = require('./src/client');
const Itau = require('./src/itau');
const Query = require('./src/query');
const { STYLE } = require('./src/utils');

async function fetchTransactions (query, credentials) {

    //if (mock) return [{ getTransactions: () => [], normalizeData: () => {} }, null];

    let page = null
    try {
        
        const itau = new Itau();
        const browser = await Client.newBrowserInstance(puppeteer, !false);
        page = await itau.createPage(browser);
        
        await page.bringToFront();
        await itau.logIn(page, credentials);
        await itau.virtualKeyboard(page, credentials);
        await itau.checkForBanners(page);
        await itau.transactionsHistory(page);

        const transactions = await itau.getTransactions(page, query);

        await browser.close();

        return [transactions, null];

    } catch(err) {
        let print = null
        if (page !== null) {
            print = await page.screenshot({ path: 'screenshot.png', encoding: 'base64' });
        }
        return [null, err, print];
    }
}

async function getTransactions(period, credentials) {
    console.log(STYLE.Bright + '***==STARTING ITAU INTERNET BANKING CRAWLER==***\n' + STYLE.Reset);

    const query = Query.PARSE(period);

    const [transactions, err, print] = await fetchTransactions(query, credentials);
    
    if (err) throw {err: err.toString(), print};

    return transactions.getTransactions();
}

module.exports = {
    getTransactions   
}
