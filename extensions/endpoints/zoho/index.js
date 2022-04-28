module.exports = function registerEndpoint(router, { services, env, database }) {
    const { ItemsService } = services;
    var utils = require('./utils');
    router.get('/sync-units', async (req, res, next) => {
        const unitsService = new ItemsService('units', { schema: req.schema });
        // console.warn("unitsService >> ", unitsService);
        const settingsService = new ItemsService('settings', { schema: req.schema });
        const products = await utils.getProducts(1, settingsService);
        if (products) {
            console.warn("products.lenght >> ", products.length);
            await products.map((product) => {
                unitsService
                    .readByQuery({
                        filter: {
                            name: product.Product_Name
                        }
                    })
                    .then(async (results) => {
                        if (results[0]) {
                            console.warn("results >> ", product.Product_Name, results[0].id);
                            unitsService.updateOne(results[0].id, {
                                status: product.Product_Active ? 'available' : 'rent'
                            })
                        } else {
                            console.warn("results else >> ", product.Product_Name, results);
                        }
                    })
            });
            res.status(200).json({ success: true })
        } else {
            res.status(500).json({ success: false })
        }
    })
    router.get('/set-tokens', async (req, res, next) => {
        const settingsService = new ItemsService('settings', { schema: req.schema });
        await utils.setTokens(settingsService);
    });
}

