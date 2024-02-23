
const cors = require('cors')
const router = require('./routes/b1Router')
const path = require('path')
const PORT = 5019
const cookieParser = require('cookie-parser')
const { app, httpServer, express } = require('./config')



app.use(cors())
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(router)



const start = async () => {
    try {
        httpServer.listen(PORT, () => console.log('Server is running http://localhost:' + PORT))
    } catch (e) {
        console.log(e)
    }
}

start()