module.exports = function registerEndpoint(router, { services, env, database }) {
    const { ItemsService } = services;
    var utils = require('./utils');
    router.get('/sync-units', async (req, res, next) => {
        const unitsService = new ItemsService('units', { schema: req.schema });
        const settingsService = new ItemsService('settings', { schema: req.schema });
        const products = await utils.get(1, settingsService, unitsService);
        if (products) {
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

