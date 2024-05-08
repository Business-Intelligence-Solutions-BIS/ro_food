const {config} =require("../configs/index");
const axios = require('axios');

async function sendNotification(userKey, title, body) {
    try {
        const url = 'https://onesignal.com/api/v1/notifications';
        const API_KEY = config.ONE_SINGAL_APP_KEY; 

        const headers = {
            'Authorization': `Basic ${API_KEY}`,
            'content-type': 'application/json'
        };

        const data = {
            app_id: config.ONE_SIGNAL_APP_ID, 
            include_aliases: {
                external_id: [userKey]
            },
            target_channel: 'push',
            contents: {
                en: body
            },
            headings: {
                en: title
            }
        };

        // const response = await axios.post(url, data, { headers });
        const response = await axios.post(url, data, { headers });

        if (response.status !== 200) {
            return { status: false, code: response.status, message: 'Error in sending notification' };
        }

        return { status: true, code: response.status, message: 'Notification sent successfully' };
    } catch (error) {
        return { status: false, code: 500, message: 'Error in sending notification' };
    }
}

module.exports = {
    sendNotification
}