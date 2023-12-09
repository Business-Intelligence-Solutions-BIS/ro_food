
const Axios = require("axios");
const https = require("https");
const { get, rest } = require("lodash");
const { io, socket } = require("../config");
const { CREDENTIALS } = require("../credentials");
const { writeUser, saveSession, writeRoom, writeTransferRequest, findSession, writeNotification, infoRoom, infoUser, infoNotification, writeMessage, updateNotification, deleteNotification } = require("../helpers");
const CustomController = require("./customController");
const Controller = require("./customController");
const ShortUniqueId = require('short-unique-id');
const customController = require("./customController");
const { randomUUID } = new ShortUniqueId({ length: 10 });
class b1Controller {
    async test(req, res, next) {
        try {
            return res.status(201).json('Assalomu Aleykum')
        }
        catch (e) {
            return next(e)
        }
    }

    async login(req, res, next) {
        try {
            delete req.headers.host
            delete req.headers['content-length']
            let ret = await CustomController.uiLogin(req.body)
            if (ret.status !== 200 && ret.status !== 201) {
                console.log('tushdi error')
                return res.status(ret.status || 400).send({
                    "error": {
                        "message": ret.data
                    }
                });
            }


            if (ret.headers['set-cookie'] && ret.headers['set-cookie'][0]) {
                ret.headers['set-cookie'][0] += '; Path=/'
            }

            saveSession({
                ...ret.data,
                empID: ret.userData.EmployeeID,
                startedAt: (new Date).valueOf()
            })

            res.set({
                ...ret.headers
            })
            return res.status(ret.status).send(ret.data)
        }
        catch (e) {
            return next(e)
        }
    }

    async get(req, res, next) {
        try {
            let { b1Api } = req.params
            delete req.headers.host
            delete req.headers['content-length']
            if (b1Api) {
                const axios = Axios.create({
                    baseURL: "https://su26-02.sb1.cloud/",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .get(req.originalUrl)
                    .then(({ data }) => {
                        return res.status(200).json(data);
                    })
                    .catch(async (err) => {
                        return res.status(get(err, 'response.status', 500)).json(get(err, 'response.data', `Error`))
                    });
            }
            return res.status(404).json({ status: false, message: 'B1 Api not found' })

        }
        catch (e) {
            return next(e)
        }
    }
    async StockTransfersGet(req, res, next) {
        try {
            let { skip = 0 } = req.query
            delete req.headers.host
            delete req.headers['content-length']
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            let notification = infoNotification().filter(item => item.fromEmpId == sessionData?.empID && item.api == 'StockTransfers')
            let actNotification = notification
            notification = notification.slice(skip, +skip + 20)
            let len = notification.length
            let slLen = actNotification.slice(skip, +skip + 21).length
            notification = { data: notification, nextPage: (len != slLen ? (+skip + 20) : - 1) }
            return res.status(200).json(notification);
        }
        catch (e) {
            return next(e)
        }
    }

    async post(req, res, next) {
        try {
            let { b1Api } = req.params
            delete req.headers.host
            delete req.headers['content-length']
            if (b1Api) {
                const axios = Axios.create({
                    baseURL: "https://su26-02.sb1.cloud",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .post(req.originalUrl, req.body)
                    .then(({ data }) => {
                        return res.status(201).json(data);
                    })
                    .catch(async (err) => {
                        return res.status(get(err, 'response.status', 500)).json(get(err, 'response.data', `Error`))
                    });
            }
            return res.status(404).json({ status: false, message: 'B1 Api not found' })

        }
        catch (e) {
            return next(e)
        }
    }

    async StockTransfers(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let wrhRoomId = infoRoom().find(item => item?.wrh == get(req, 'body.ToWarehouse'))
                let qualityControllerRoomId = infoRoom().find(item => item?.job == 'qualitycontroller')
                if (wrhRoomId) {
                    io.to(wrhRoomId.socket).emit('notification', {
                        ...req.body,
                        empId: get(sessionData, 'empID'),
                        api: 'StockTransfers',
                        path: 'notificationStockTransfers',
                        title: 'На утверждении'
                    })
                }
                if (qualityControllerRoomId) {
                    io.to(qualityControllerRoomId.socket).emit('notification', {
                        ...req.body,
                        empId: get(sessionData, 'empID'),
                        api: 'StockTransfers',
                        path: 'notificationStockTransfers',
                        title: 'На утверждении'
                    })
                }
                let uid = randomUUID()
                let toEmpId = infoUser().sessions.find((item) => item.wrh == get(req, 'body.ToWarehouse'))?.empID
                let qualityEmpId = infoUser().sessions.find((item) => item.jobTitle == 'qualitycontroller')?.empID
                if (toEmpId && qualityEmpId) {
                    writeNotification({ date: new Date(), body: req.body, uid, fromEmpId: get(sessionData, 'empID'), toEmpId, qualityEmpId, path: 'notificationStockTransfers', api: 'StockTransfers', wrhmanager: 0, qualitycontroller: 0 })
                    return res.status(201).send({ status: true })
                }
                else if (!toEmpId) {
                    return res.status(404).send({ status: false, message: 'Warehouse Employe not found' })
                }
                else if (!qualityEmpId) {
                    return res.status(404).send({ status: false, message: 'Quality Controller not found' })
                }

            }
            else {
                return res.status(401).send()
            }
        }
        catch (e) {
            return next(e)
        }
    }

    async PurchaseOrders(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let qualityControllerRoomId = infoRoom().find(item => item?.job == 'qualitycontroller')
                if (qualityControllerRoomId) {
                    io.to(qualityControllerRoomId.socket).emit('notification', {
                        ...req.body,
                        empId: get(sessionData, 'empID'),
                        api: 'PurchaseOrders',
                        path: 'notificationPurchaseOrders',
                        title: 'На утверждении'
                    })
                }
                let uid = randomUUID()
                let qualityEmpId = infoUser().sessions.find((item) => item.jobTitle == 'qualitycontroller')?.empID
                if (qualityEmpId) {
                    writeNotification({ date: new Date(), body: req.body, uid, fromEmpId: get(sessionData, 'empID'), qualityEmpId, path: 'notificationPurchaseOrders', api: 'PurchaseOrders', qualitycontroller: 0 })
                    return res.status(201).send({ status: true })
                }
                else if (!qualityEmpId) {
                    return res.status(404).send({ status: false, message: 'Quality Controller not found' })
                }

            }
            else {
                return res.status(401).send()
            }
        }
        catch (e) {
            return next(e)
        }
    }
    async PurchaseOrdersStatus(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let { status, job, uid, DocumentLines } = req.body
                let infoNot = infoNotification().find(item => item.uid == uid)
                if (infoNot) {
                    if (infoNot[job] == 0) {
                        if (status) {
                            updateNotification(uid, Object.fromEntries([[job, 2]]))
                            updateNotification(uid, { body: { ...infoNot.body, DocumentLines } })
                            let roomId = infoRoom().find(item => item.empId == infoNot.DocumentsOwner)
                            let infoNotNew = infoNotification().find(item => item.uid == uid)
                            if (roomId) {
                                io.to(roomId.socket).emit('confirmedPurchase', { ...infoNotNew, confirmed: job, path: "message", title: 'Поступление товаров' })
                            }
                            if (infoNotNew.qualitycontroller == 2) {
                                deleteNotification(infoNotNew.uid)
                            }
                            writeMessage({ ...infoNotNew, date: new Date(), confirmed: job })
                        }
                        else {
                            updateNotification(uid, Object.fromEntries([[job, 1]]))
                            updateNotification(uid, { body: { ...infoNot.body, DocumentLines } })

                            let roomId = infoRoom().find(item => item.empId == infoNot.DocumentsOwner)
                            let infoNotNew = infoNotification().find(item => item.uid == uid)
                            if (roomId) {
                                io.to(roomId.socket).emit('notconfirmedPurchase', { ...infoNotNew, confirmed: job, path: "message", title: 'Поступление товаров' })
                            }
                            writeMessage({ ...infoNotNew, date: new Date(), confirmed: job })
                        }
                        return res.status(200).send()
                    }
                    else {
                        return res.status(403).send({ message: 'Tasdiqlay olmaysiz' })
                    }
                }
                else {
                    return res.status(404).send({ status: false, message: 'uid Topilmadi' })
                }
            }
            else {
                return res.status(401).send()
            }
        }
        catch (e) {
            return next(e)
        }
    }
    async PurchaseOrdersGet(req, res, next) {
        try {
            delete req.headers.host
            delete req.headers['content-length']
            const sessionId = req.cookies['B1SESSION'];
            let { skip = 0 } = req.query
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let notification = infoNotification().filter(item => item?.fromEmpId == sessionData?.empID && item.api == 'PurchaseOrders')
                let actNotification = notification
                notification = notification.slice(skip, +skip + 20)
                let len = notification.length
                let slLen = actNotification.slice(skip, +skip + 21).length
                notification = { data: notification, nextPage: (len != slLen ? (+skip + 20) : - 1) }
                return res.status(200).json(notification);
            }
            else {
                return res.status(401).send()
            }

        }
        catch (e) {
            return next(e)
        }
    }

    async StockTransfersStatus(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let { status, job, uid } = req.body
                let infoNot = infoNotification().find(item => item.uid == uid)
                if (infoNot) {
                    if (infoNot[job] == 0) {
                        if (status) {
                            updateNotification(uid, Object.fromEntries([[job, 2]]))
                            let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
                            let infoNotNew = infoNotification().find(item => item.uid == uid)
                            if (roomId) {
                                io.to(roomId.socket).emit('confirmedStockTransfer', { ...infoNotNew, confirmed: job, path: "message", title: 'Перемещение запасов' })
                            }
                            if (infoNotNew.wrhmanager == 2 && infoNotNew.qualitycontroller == 2) {
                                deleteNotification(infoNotNew.uid)
                            }
                            writeMessage({ ...infoNotNew, date: new Date(), confirmed: job })
                        }
                        else {
                            updateNotification(uid, Object.fromEntries([[job, 1]]))
                            let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
                            let infoNotNew = infoNotification().find(item => item.uid == uid)
                            if (roomId) {
                                io.to(roomId.socket).emit('notconfirmedStockTransfer', { ...infoNotNew, confirmed: job, path: "message", title: 'Перемещение запасов' })
                            }
                            writeMessage({ ...infoNotNew, date: new Date(), confirmed: job })
                        }
                        return res.status(200).send()
                    }
                    else {
                        return res.status(403).send({ message: 'Tasdiqlay olmaysiz' })
                    }
                }
                else {
                    return res.status(404).send({ status: false, message: 'uid Topilmadi' })
                }
            }
            else {
                return res.status(401).send()
            }
        }
        catch (e) {
            return next(e)
        }
    }

    async patch(req, res, next) {
        try {
            let { b1Api } = req.params
            delete req.headers.host
            delete req.headers['content-length']
            if (b1Api) {
                const axios = Axios.create({
                    baseURL: "https://su26-02.sb1.cloud",
                    timeout: 30000,
                    headers: req.headers,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                });
                return axios
                    .patch(req.originalUrl, req.body)
                    .then(({ data }) => {
                        return res.status(204).json(data);
                    })
                    .catch(async (err) => {
                        return res.status(get(err, 'response.status', 500)).json(get(err, 'response.data', `Error`))
                    });
            }
            return res.status(404).json({ status: false, message: 'B1 Api not found' })

        }
        catch (e) {
            return next(e)
        }
    }


}

module.exports = new b1Controller()