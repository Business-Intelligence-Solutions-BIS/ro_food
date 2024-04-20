const OneSignal = require('@onesignal/node-onesignal');
const {config} =require("../config/index");

async function sendNotification(userKey,contentData){
    try{
        console.log("Notification is started")
        const configuration = OneSignal.createConfiguration({
            userKey,
            appKey: config.ONE_SINGAL_APP_KEY
        });

        const client = new OneSignal.DefaultApi(configuration);

        const app = await client.getApp(config.ONE_SIGNAL_APP_ID);

        const notification = new OneSignal.Notification();

        notification.app_id = app.id;

        notification.name = "Test Notification";

        notification.contents = contentData

        notification.headings = `Notification Title`

        const notificationResponse = await client.createNotification(notification);

        return notificationResponse.errors;
    }catch(error){
        console.log("Error in sendNotification",error.message)
    }
}

module.exports = {
    sendNotification
}