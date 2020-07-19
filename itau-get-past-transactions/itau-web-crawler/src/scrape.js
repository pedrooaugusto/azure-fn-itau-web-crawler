/* Functions to retrieve data from Itau Internet Banking Page */

class Scrape {

    allowedToBeEmpty = ["01/2018", "02/2018", "03/2018"];

    isAllowedToBeEmpty (period) {
        return this.allowedToBeEmpty.indexOf(period) !== -1;
    }

    async transactions (page, period, query) {
        if (this.isAllowedToBeEmpty(period)) return []

        for (let i = 0; i < 5; i++) {
            const res = await page.evaluate(command => {

                if (typeof consultarLancamentosPorPeriodo !== 'function')
                    return { err: true, msg: 'consultarLancamentosPorPeriodo not a function' };
                else
                    consultarLancamentosPorPeriodo(command, 'mesCompleto');

                return false;
            }, period);
            
            if (res && res.err) throw new Error(res.err);
            
            await page.waitFor(7000);

            try {                
                await page.waitForFunction((period) => {
                    const viewHasChanged = !!$("#extrato-resultado-filtro-lancamentos").text().match(period);
                    const listHasChanged = typeof lancamentosCompleta === 'object' &&
                        lancamentosCompleta.length > 0
                        && lancamentosCompleta[3].dataLancamento.endsWith(period);

                    return viewHasChanged && listHasChanged;

                }, { polling: 2500 }, period);

                await page.waitFor(3000);

                return await page.evaluate(() => lancamentosCompleta || []);
            } catch (err) {

            }
        }
        
        throw new Error("get transactions from page timed out");
    }

    async transactions1 (page, period, query) {
        const res = await page.evaluate(command => {

            if (typeof consultarLancamentosPorPeriodo !== 'function')
                return {err: true, msg: 'consultarLancamentosPorPeriodo not a function'};
            else
                consultarLancamentosPorPeriodo(command, 'mesCompleto');

            return false;

        }, period);

        if (res && res.err) throw new Error(res.err);

        await page.waitFor(10000);
        await page.waitForFunction((period) => {
            const viewHasChanged = !!$("#extrato-resultado-filtro-lancamentos").text().match(period);
            const listHasChanged = typeof lancamentosCompleta === 'object'
                && lancamentosCompleta.length !== undefined;

            const m = ["01/2018", "02/2018", "03/2018"].indexOf(period) !== -1 || listHasChanged &&
                lancamentosCompleta.length > 0 &&
                lancamentosCompleta[1].dataLancamento.endsWith(period);

            return viewHasChanged && listHasChanged && m;

        }, period);
        await page.waitFor(3000);

        return await page.evaluate(() => lancamentosCompleta || []);
    }
}

module.exports = Scrape;
