const dotenv = require('dotenv')

dotenv.config()

const config = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    ONE_SIGNAL_APP_ID: process.env.ONE_SIGNAL_APP_ID,
    ONE_SINGAL_APP_KEY: process.env.ONE_SINGAL_APP_KEY,
    SAP_COMPANY_DB_PROD: process.env.SAP_COMPANY_DB_PROD,
    SAP_USERNAME_PROD: process.env.SAP_USERNAME_PROD,
    SAP_PASSWORD_PROD: process.env.SAP_PASSWORD_PROD,
    SAP_COMPANY_DB_DEV: process.env.SAP_COMPANY_DB_DEV,
    SAP_USERNAME_DEV: process.env.SAP_USERNAME_DEV,
    SAP_PASSWORD_DEV: process.env.SAP_PASSWORD_DEV
}

module.exports = {config}