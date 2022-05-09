const config = {
    client: {
        id: '1000.K2TAOJOO7IVJCA96KG55ZQZG20ZQJF',
        secret: '8b9844faf47631e62c68d9bdb99af560b026755096'
    },
    auth: {
        tokenHost: 'https://accounts.zoho.com/',
        tokenPath: 'oauth/v2/token',
        authorizePath: 'oauth/v2/auth',

    }
};
setTokens = async (settingsService = null) => {
    const { AuthorizationCode } = require('simple-oauth2');
    const redis = require('redis');
    const rclient = redis.createClient({
        socket: {
            port: 7480
        }
    });
    rclient.connect();
    try {
        return await settingsService
            .readByQuery({ fields: ['z_t'] })
            .then(async (results) => {
                console.warn("results >> ", results[0]);
                var code = results[0].z_t;
                const client = new AuthorizationCode(config);
                const tokenParams = {
                    scope: 'ZohoCRM.modules.ALL',
                    code: code
                };
                console.warn("tokenParams >> ", tokenParams);

                const accessToken = await client.getToken(tokenParams, { json: true });
                if (accessToken.token.error)
                    throw accessToken.token

                console.warn("accessToken >> ", accessToken);

                rclient.set('__tokens', JSON.stringify(accessToken));
                return true;

            })
            .catch((error) => {
                console.warn("error.message >> ", error);
                return error;
            });

    } catch (e) {
        console.warn("error.message >> ", e);
        return e;
    }
}


refreshToken = async () => {
    const axios = require('axios');
    const redis = require('redis');
    try {
        const rclient = redis.createClient({
            socket: {
                port: 7480
            }
        });
        rclient.connect();
        var tokens = JSON.parse(await rclient.get('__tokens'));
        console.warn("tokens refreshToken >> ", tokens);
        var options = {
            method: 'post',
            baseURL: 'https://accounts.zoho.com',
            headers: {
                "content-type": "application/json"
            }
        };
        options.url = `/oauth/v2/token?refresh_token=${tokens.refresh_token}&client_id=${config.client.id}&client_secret=${config.client.secret}&grant_type=refresh_token`

        var response = await axios(options);
        console.warn("response refreshToken >> ", response.data);
        var accessToken = response.data;
        accessToken.refresh_token = tokens.refresh_token;
        rclient.set('__tokens', JSON.stringify(accessToken));
        Promise.resolve(response);
    } catch (e) {
        console.warn("error.message refreshToken >> ", e);
        return { error: e };
        // res.status(500).json({ error: e });
    }
}

getTokens = async () => {
    const redis = require('redis');
    const rclient = redis.createClient({
        socket: {
            port: 7480
        }
    });
    rclient.connect();

    try {
        if (!rclient.get('__tokens'))
            return false;
        return JSON.parse(await rclient.get('__tokens'))
    } catch (e) {
        return { error: e };
    }
}

var products = [];
getUnits = async (page = 1, settingsService, unitsService) => {
    const axios = require('axios');
    var _ = require('lodash');
    if (!await getTokens()) {
        var result = await setTokens(settingsService);
        console.warn("result >> ", result);
        if (!result) {
            var options = {
                method: 'post',
                baseURL: 'https://api.emailjs.com/api/v1.0/email/',
                headers: {
                    "content-type": "application/json",
                },

                data: {
                    service_id: 'service_2ksdtlf',
                    template_id: 'template_gt_error',
                    user_id: 'Es-aRHgfPr2P34aoY',
                    accessToken: 'KAAjS66wtPu5srTgNfA6W',
                    template_params: {
                        to_mail: 'usamecavga@gmail.com'
                    }
                }
            };
            options.url = `send`
            var response = await axios(options);
            return;
        }
    }
    console.warn("page >> ", page);
    const tokens = await getTokens();
    var options = {
        method: 'get',
        baseURL: 'https://www.zohoapis.com/crm/v2.1/',
        headers: {
            "content-type": "application/json",
            "Authorization": `Zoho-oauthtoken ${tokens.access_token}`
        },
        params: {
            page: page
        }
    };
    options.url = `Products`
    try {
        var response = await axios(options);
        const productsResponse = response.data;
        console.warn("productsResponse.info >> ", productsResponse.info);
        const p = productsResponse.data
        if (p) {
            await p.map((product) => {
                unitsService
                    .readByQuery({
                        filter: {
                            name: product.Product_Name
                        }
                    })
                    .then(async (results) => {
                        if (results[0]) {
                            unitsService.updateOne(results[0].id, {
                                status: product.Product_Active ? 'available' : 'rent'
                            })
                        } else {
                            // console.warn("results else >> ", product.Product_Name, results);
                        }
                    })
            });
            await getUnits(++page, settingsService, unitsService);
        } else {
            return true;
        }
    } catch (e) {
        console.warn("error.message getUnits >> ", e);
        if (e.response.status === 401) {
            await refreshToken();
            await getUnits(1, settingsService, unitsService);
        }else{
            return { error: e };
        }
    }
}

module.exports = {
    get: async (page, settingsService, unitsService) => {
        const rp = await getUnits(page, settingsService, unitsService)
        return true;
    }
}