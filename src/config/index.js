const dotenv = require('dotenv')

dotenv.config()

const config = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    ONE_SIGNAL_APP_ID: process.env.ONE_SIGNAL_APP_ID,
    ONE_SINGAL_APP_KEY: process.env.ONE_SINGAL_APP_KEY
}

module.exports = {config}