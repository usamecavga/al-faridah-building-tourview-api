
const axios = require('axios');
module.exports = ({ schedule }) => {
    schedule('35 0 * *', async () => {
        console.warn("schedule is runing");
		await axios.get('https://xplor.alfaridah.ae/api/zoho/sync-units', { message: 'Job Done' });
	});
};