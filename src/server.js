const express = require('express')
const cors = require('cors')
const router = require('./routes/b1Router')
const path = require('path')
const PORT = process.env.PORT || 3000
const cookieParser = require('cookie-parser')

const app = express()

app.use(cors())
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(router)




const start = async () => {
    try {
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start()