const Router = require('express')
const b1Controller = require('../controllers/b1Controller')
const router = new Router()

router.get('/api/test', b1Controller.test)
router.get('/b1s/v1/:b1Api', b1Controller.get)

router.post('/b1s/v1/:b1Api', b1Controller.post)
router.post('/b1s/v1/Login', b1Controller.login)

router.patch('/b1s/v1/:b1Api', b1Controller.patch)

module.exports = router
