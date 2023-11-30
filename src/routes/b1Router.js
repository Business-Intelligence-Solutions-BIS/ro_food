const Router = require('express')
const b1Controller = require('../controllers/b1Controller')
const customController = require('../controllers/customController')
const router = new Router()

router.get('/api/test', b1Controller.test)
router.get('/api/userData', customController.userData)
router.get('/api/notification', customController.notification)
router.get('/api/notificationMenu', customController.notificationMenu)
router.get('/api/menu', customController.menu)

router.post('/api/login', b1Controller.login)
router.post('/api/StockTransfers', b1Controller.StockTransfers)

router.get('/ServiceLayer/b1s/v2/:b1Api', b1Controller.get)

router.post('/ServiceLayer/b1s/v2/:b1Api', b1Controller.post)

router.patch('/ServiceLayer/b1s/v2/:b1Api', b1Controller.patch)

module.exports = router
