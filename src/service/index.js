const {config} =require("../config/index");
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
        await axios.post(url, data, { headers }).then(a=>{
        })

        // console.log(JSON.stringify(response,null, 2))
    
        if (response.status !== 200) {
            return { code: response.code, status: false, message: 'Error in sending notification' };
        }

        return { status: true, message: 'Notification sent successfully' };
    } catch (error) {
        return { status: false, message: 'Error in sending notification' };
    }
}

module.exports = {
    sendNotification
}