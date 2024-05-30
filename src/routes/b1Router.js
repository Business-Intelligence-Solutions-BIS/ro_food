const Router = require('express')
const b1Controller = require('../controllers/b1Controller')
const customController = require('../controllers/customController')
const router = new Router()

// bu shunchaki serverdan javob qaytyaptimi degan manodagi tekshiruv
router.get('/api/test', b1Controller.test)

//***** login *****
router.post('/api/login', b1Controller.login)
router.post('/api/web/login', b1Controller.webLogin)
//-------------------------------------------

// ***** update lang *****
router.post('/api/update-lang', b1Controller.updateUserLang)
//----------------------------------------------

//***** notification uchun *****
// router.post('/api/token', b1Controller.updateToken)
router.post('/api/send-notification', b1Controller.sendNotitifications)
//-------------------------------------------

//*****mobildagi skladdagi mahsulotlarni gurpa bo'yicha filter  *****
router.get('/api/getItemsByGroups', b1Controller.getItemsByGroups)
router.get('/api/out-in-payments', b1Controller.getOutAnInPaymentDetails)
//--------------------------------------------

//***** XS SQL ishga tushirish *****
router.get('/api/xsSql/:xsFuncName', b1Controller.xsSql)
//--------------------------------------------

////***** sapga backend orqali zapros berish *****
router.get('/ServiceLayer/b1s/v2/:b1Api', b1Controller.get)
router.post('/ServiceLayer/b1s/v2/:b1Api', b1Controller.post)
router.patch('/ServiceLayer/b1s/v2/:b1Api', b1Controller.patch)
        //native sqlni get qilish uchun
router.get('/ServiceLayer/b1s/v2/:b1Api/List', b1Controller.get)
//-----------------------------------------------

module.exports = router
