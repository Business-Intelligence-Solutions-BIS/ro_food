const Router = require('express')
const b1Controller = require('../controllers/b1Controller')
const customController = require('../controllers/customController')
const router = new Router()

router.get('/api/test', b1Controller.test)
router.get('/api/userData', customController.userData)

router.get('/api/menu', customController.menu)
router.get('/api/purchaseMenu', customController.purchaseMenu)
router.get('/api/productionMenu', customController.productionMenu)
router.get('/api/inventoryMenu', customController.inventoryMenu)



router.post('/api/login', b1Controller.login)
router.post('/api/PurchaseOrders', b1Controller.PurchaseOrders)


router.get('/api/PurchaseOrdersGet', b1Controller.PurchaseOrdersGet)
router.post('/api/PurchaseOrdersStatus', b1Controller.PurchaseOrdersStatus)

router.post('/api/ProductionOrders', b1Controller.ProductionOrders)
router.post('/api/ProductionOrdersStatus', b1Controller.ProductionOrdersStatus)

router.get('/api/ProductionOrdersGet', b1Controller.ProductionOrdersGet)


router.get('/api/ItemStock', b1Controller.ReturnItemStock)
router.post('/api/productionOrderSocket', b1Controller.ProductionOrderSocket)




router.get('/ServiceLayer/b1s/v2/:b1Api', b1Controller.get)

router.post('/ServiceLayer/b1s/v2/:b1Api', b1Controller.post)

router.patch('/ServiceLayer/b1s/v2/:b1Api', b1Controller.patch)

module.exports = router
