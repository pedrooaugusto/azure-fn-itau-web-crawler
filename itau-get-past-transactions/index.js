const ItauWebCrawler = require('./itau-web-crawler');
const bcrypt = require('bcrypt');

const API_KEY = "$2b$10$/10T3f7VYjr6a7zWENKc7uZ6K639RUVJ3SkA5BAGoJ5hAnEJQ4EyW";

module.exports = async function (context, req) {
    const api_key = (req.query.api_key || (req.body && req.body.api_key));

    try {
        const ok = await bcrypt.compare(api_key, API_KEY);
        if (ok !== true) {
            context.res = { status: 400, body: "Unauthorized." };
            return;
        }
    } catch(err) {
        context.res = { status: 400, body: "Unauthorized." };
        return;
    }

    const period = (req.query.period || (req.body && req.body.period) || 'LATEST 5');

    const AGENCIA = (req.query.agencia || (req.body && req.body.agencia));
    const CONTA = (req.query.conta || (req.body && req.body.conta));
    const IBPASS = (req.query.ibpass || (req.body && req.body.ibpass));

    try {        
        if (!AGENCIA || !CONTA || !IBPASS) {
            throw new Error("Empty Internet Banking Credentials!");
        }

        const transactions = await ItauWebCrawler.getTransactions(period, {
            AGENCIA,
            CONTA,
            IBPASS
        });

        context.res = {
            status: 200,
            body: transactions
        };

    } catch(err) {
        context.res = {
            status: 500,
            body: err
        };
    }
}