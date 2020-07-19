const moment = require('moment');
const { DATE_FORMAT: FORMAT } = require('./utils');

const LATEST = (d = 5) => ({
    desc: `Latest ${d} days`,
    fn: (x, exact = true) => {
        const date = moment(x, FORMAT);
        const lastDays = moment().subtract(d, 'days');

        if (exact) return date.isBetween(lastDays, moment());

        // has the possibility to be (compare month and year)
        return (date.isSame(lastDays, 'month') && date.isSame(lastDays, 'year')) ||
            (date.isSame(moment(), 'month') && date.isSame(moment(), 'year'));
    }
});

const BETWEEN = (d1, d2) => ({
    desc: `Between ${d1} and ${d2}`,
    fn: x => moment(x, FORMAT).isBetween(d1, d2)
});

const MONTH = (m) => ({
    desc: `In the month of ${moment(m, 'MM').format('MMMM')}`,
    fn: x => moment(x, FORMAT).isSame(moment(m, 'MM'), 'month')
});

const ALL = () => ({
    desc: 'Any transaction (All of them)',
    fn: x => true
});

const PARSE = s => {
    const [query, ...args] = s.split(' ');

    switch (query) {
        case 'MONTH':
            return MONTH(args[0]);

        case 'LATEST':
            return LATEST(args[0]);

        case 'BETWEEN':
            return BETWEEN(...args);

        default:
            return ALL('*');
    }
}

module.exports = {
    LATEST,
    BETWEEN,
    MONTH,
    ALL,
    PARSE
}