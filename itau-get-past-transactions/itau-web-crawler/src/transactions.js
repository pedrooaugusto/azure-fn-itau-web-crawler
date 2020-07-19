/* Data sctructure to save and manipule transactions
*/
const moment = require('moment');
const { DATE_FORMAT, money } = require('./utils');
const crypto = require('crypto');

class Transaction {
    constructor ({date, value, result, description, origin}, raw) {
        this.date = date;
        this.value = value;
        this.result = result;
        this.description = description;
        this.origin = origin;

        this.__includedDate = null;
        this.__hash = this.makeHash(value, raw);
        this.__raw = raw;
    }

    static parse (raw) {
        return new Transaction({
            date: moment(raw.dataLancamento, DATE_FORMAT),
            value: money(raw),
            result: undefined,
            description: raw.descricaoLancamento,
            origin: raw.agenciaOrigem
        }, raw);
    }

    toString () {
        return `{
            description: ${this.description},
            date: ${this.date},
            value: ${this.value},
            result: ${this.result},
            origin: ${this.origin},
            __includedDate: ${this.__includedDate},
            __hash: ${this.__hash},
            __raw: ${JSON.stringify(this.__raw)}
        }`;
    }

    makeHash (value, raw) {
        const data = (raw.dataLancamento + raw.descricaoLancamento + value);
    
        return crypto.createHash('md5').update(data).digest('hex');
    }
}

class Transactions {
    
    constructor (transactions = [[]], filter = () => true) {
        this.filter = filter;
        this.transactions = [];

        for (const raw of transactions.reduce((a, e) => [...a, ...e], [])) {
            if (!!raw.dataLancamento && filter(raw.dataLancamento)) {
                this.transactions.push(Transaction.parse(raw));
            }
        }
    }

    add (fields, raw) {
        this.transactions.push(new Transaction(fields, raw));
    }

    /**
     * Split all transactions equally in a given day
    */
    normalDistributedOverTheDay () {
        
        const days = this.transactions.reduce((ac, el) => {
            const t = el.date.toString();
            
            if (ac.has(t)) ac.get(t).push(el);
            else ac.set(t, [el]);

			return ac;

		}, new Map());

		for (let [key, value] of days.entries()) {
			const f = Math.floor((24/value.length) * 100)/100;
            
            value = value
                .sort((a, b) => a.value < b.value ? 1 : -1)
			    .map((v, i) => {
                    const c = new Date(v.date).getTime();
                    const s = ((i*f * 60 * 60 * 1000) - 1000);
                    const date = new Date(c + s)
                    
                    return { ...v, date };
                });
            
            days.set(key, value);
		}

		this.transactions = Array.from(days.values()).reduce((a, e) => {
			a.push(...e);
			return a;
        }, []);

    }

    /**
     * Normalizes the description field removes the RSHOP
     * prefix begin, all unnecessary spaces and the date
     * at end.
     * 
     * 'RSHOP    WILLIAMS-19/01  ' -> 'WILLIAMS'
    */
    normalizeDescriptionText () {
        const format = a => a.replace(/(^RSHOP-?)|(-?\d\d\/\d\d)/g, '').replace(/\s\s+/g, ' ').trim();
        const currentDate = moment();
        this.transactions = this.transactions.map(a => {
            a.description = format(a.description);
            a.__includedDate = currentDate;
            return a;
        });
    }

    normalizeData () {
        this.normalDistributedOverTheDay();
        this.normalizeDescriptionText();
    }

    getTransactions () {
        return this.transactions;
    }

    toString () {
        this.normalizeData();

        return JSON.stringify(this.transactions);
    }
}

module.exports = Transactions;
