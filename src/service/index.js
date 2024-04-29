const {config} =require("../config/index");
const axios = require('axios');

async function sendNotification(userKey, contentData) {
    try {
        const url = 'https://onesignal.com/api/v1/notifications';
        const API_KEY = config.ONE_SINGAL_APP_KEY; 

        console.log("APP_KEY: " + config.ONE_SINGAL_APP_KEY + "\n" + "APP_ID: " + config.ONE_SIGNAL_APP_ID)
        const headers = {
            'Authorization': `Basic ${API_KEY}`,
            'content-type': 'application/json'
        };

        console.log("header -> ")
        console.log(JSON.stringify(headers, 2))
        const data = {
            app_id: config.ONE_SIGNAL_APP_ID, 
            include_aliases: {
                external_id: [userKey]
            },
            target_channel: 'push',
            data: {
                foo: contentData
            },
            contents: {
                en: "JSON.stringify(contentData)"
            },
            headings: {
                en: 'Test'
            }
        };

        console.log(JSON.stringify(data, 2))

        // const response = await axios.post(url, data, { headers });
        await axios.post(url, data, { headers }).then(a=>{
        console.log("Response must start here")
            console.log(a.data)
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