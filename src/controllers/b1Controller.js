
const Axios = require("axios");
const https = require("https");
const { get } = require("lodash");
const { io, socket, socketIo } = require("../config");
const { CREDENTIALS } = require("../credentials");
const { writeUser, saveSession, writeRoom, writeTransferRequest, findSession, writeNotification, infoRoom, infoUser, infoNotification, writeMessage, updateNotification, deleteNotification, writePurchase, infoPurchase, updatePurchase, updatePurchaseTrue, updateEmp, deletePurchase, infoProduction, updateProductionTrue, deleteProductionOrders, updateProduction, writeProductionOrders } = require("../helpers");
const CustomController = require("./customController");
const Controller = require("./customController");
const ShortUniqueId = require('short-unique-id');
const customController = require("./customController");
const { GetItemStock } = require("./customController");
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
                        if (['PurchaseOrders', 'PurchaseInvoices'].includes(b1Api) && data?.value?.length) {
                            const sessionId = req.cookies['B1SESSION'];
                            const sessionData = findSession(sessionId);
                            if (sessionData?.jobTitle == 'wrhmanager') {
                                let docEntryLists = data.value.map(item => item.DocEntry).filter(item => item > get(sessionData, `${b1Api}`, 0))
                                if (docEntryLists?.length) {
                                    data.value = data.value.map(item => {
                                        return { ...item, empSeen: (item.DocEntry > get(sessionData, `${b1Api}`, 0)) ? false : true }
                                    })
                                    let max = Math.max(...docEntryLists)
                                    updateEmp(sessionData?.empID, Object.fromEntries([[b1Api, max]]))
                                }
                            }

                        }
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

    // async StockTransfers(req, res, next) {
    //     try {
    //         console.log('ishlavoti')
    //         const sessionId = req.cookies['B1SESSION'];
    //         const sessionData = findSession(sessionId);
    //         console.log(sessionData, ' bu sessionData')
    //         if (sessionData) {
    //             let wrhRoomId = infoRoom().find(item => item?.wrh == get(req, 'body.ToWarehouse'))
    //             let qualityControllerRoomId = infoRoom().find(item => item?.job == 'qualitycontroller')
    //             if (wrhRoomId) {
    //                 io.to(wrhRoomId.socket).emit('notification', {
    //                     ...req.body,
    //                     empId: get(sessionData, 'empID'),
    //                     api: 'StockTransfers',
    //                     path: 'notificationStockTransfers',
    //                     title: 'На утверждении'
    //                 })
    //             }
    //             if (qualityControllerRoomId) {
    //                 io.to(qualityControllerRoomId.socket).emit('notification', {
    //                     ...req.body,
    //                     empId: get(sessionData, 'empID'),
    //                     api: 'StockTransfers',
    //                     path: 'notificationStockTransfers',
    //                     title: 'На утверждении'
    //                 })
    //             }
    //             let uid = randomUUID()
    //             let toEmpId = infoUser().sessions.find((item) => item.wrh == get(req, 'body.ToWarehouse'))?.empID
    //             let qualityEmpId = infoUser().sessions.find((item) => item.jobTitle == 'qualitycontroller')?.empID
    //             if (toEmpId && qualityEmpId) {
    //                 writeNotification({ date: new Date(), body: req.body, uid, fromEmpId: get(sessionData, 'empID'), toEmpId, qualityEmpId, path: 'notificationStockTransfers', api: 'StockTransfers', wrhmanager: 0, qualitycontroller: 0 })
    //                 return res.status(201).send({ status: true })
    //             }
    //             else if (!toEmpId) {
    //                 return res.status(404).send({ status: false, message: 'Warehouse Employe not found' })
    //             }
    //             else if (!qualityEmpId) {
    //                 return res.status(404).send({ status: false, message: 'Quality Controller not found' })
    //             }

    //         }
    //         else {
    //             return res.status(401).send()
    //         }
    //     }
    //     catch (e) {
    //         return next(e)
    //     }
    // }
    // async StockTransfersStatus(req, res, next) {
    //     try {
    //         const sessionId = req.cookies['B1SESSION'];
    //         const sessionData = findSession(sessionId);
    //         if (sessionData) {
    //             let { status, job, uid } = req.body
    //             let infoNot = infoNotification().find(item => item.uid == uid)
    //             if (infoNot) {
    //                 if (infoNot[job] == 0) {
    //                     if (status) {
    //                         updateNotification(uid, Object.fromEntries([[job, 2]]))
    //                         let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
    //                         let infoNotNew = infoNotification().find(item => item.uid == uid)
    //                         if (roomId) {
    //                             io.to(roomId.socket).emit('confirmedStockTransfer', { ...infoNotNew, confirmed: job, path: "message", title: 'Перемещение запасов' })
    //                         }
    //                         if (infoNotNew.wrhmanager == 2 && infoNotNew.qualitycontroller == 2) {
    //                             deleteNotification(infoNotNew.uid)
    //                         }
    //                         writeMessage({ ...infoNotNew, date: new Date(), confirmed: job })
    //                     }
    //                     else {
    //                         updateNotification(uid, Object.fromEntries([[job, 1]]))
    //                         let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
    //                         let infoNotNew = infoNotification().find(item => item.uid == uid)
    //                         if (roomId) {
    //                             io.to(roomId.socket).emit('notconfirmedStockTransfer', { ...infoNotNew, confirmed: job, path: "message", title: 'Перемещение запасов' })
    //                         }
    //                         writeMessage({ ...infoNotNew, date: new Date(), confirmed: job })
    //                     }
    //                     return res.status(200).send()
    //                 }
    //                 else {
    //                     return res.status(403).send({ message: 'Tasdiqlay olmaysiz' })
    //                 }
    //             }
    //             else {
    //                 return res.status(404).send({ status: false, message: 'uid Topilmadi' })
    //             }
    //         }
    //         else {
    //             return res.status(401).send()
    //         }
    //     }
    //     catch (e) {
    //         return next(e)
    //     }
    // }
    // async StockTransfersGet(req, res, next) {
    //     try {
    //         let { skip = 0 } = req.query
    //         delete req.headers.host
    //         delete req.headers['content-length']
    //         const sessionId = req.cookies['B1SESSION'];
    //         const sessionData = findSession(sessionId);
    //         let notification = infoNotification().filter(item => item.fromEmpId == sessionData?.empID && item.api == 'StockTransfers')
    //         let actNotification = notification
    //         notification = notification.slice(skip, +skip + 20)
    //         let len = notification.length
    //         let slLen = actNotification.slice(skip, +skip + 21).length
    //         notification = { data: notification, nextPage: (len != slLen ? (+skip + 20) : - 1) }
    //         return res.status(200).json(notification);
    //     }
    //     catch (e) {
    //         return next(e)
    //     }
    // }

    async PurchaseOrders(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let qualityEmpId = infoUser().sessions.find((item) => item.jobTitle == 'qualitycontroller')?.empID
                let uid = randomUUID()
                if (qualityEmpId) {
                    let roomId = infoRoom().map(item => item.empId == qualityEmpId).socket
                    io.to(roomId).emit('notification', { qualitySeen: false, empSeen: false, createDate: new Date(), body: req.body, uid, fromEmpId: get(sessionData, 'empID'), qualityEmpId, qualitycontroller: 0, empId: qualityEmpId })
                }
                if (qualityEmpId) {
                    return res.status(201).send(writePurchase({ qualitySeen: false, empSeen: false, createDate: new Date(), body: req.body, uid, fromEmpId: get(sessionData, 'empID'), qualityEmpId, qualitycontroller: 0 }))
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
    // async ItemStock(req, res, next) {
    //     try {
    //         const sessionId = req.cookies['B1SESSION'];
    //         const sessionData = findSession(sessionId);
    //         if (sessionData) {

    //         }
    //         else {
    //             return res.status(401).send()
    //         }
    //     }
    //     catch (e) {
    //         return next(e)
    //     }
    // }
    async ProductionOrders(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            let infoNot = infoPurchase().find(item => item.uid == uid)

            if (sessionData) {
                let qualityEmpId = infoUser().sessions.find((item) => item.jobTitle == 'qualitycontroller')?.empID
                let uid = randomUUID()
                if (qualityEmpId) {
                    let roomId = infoRoom().map(item => item.empId == qualityEmpId).socket
                    let data = io.to(roomId).emit('notification', { qualitySeen: false, empSeen: false, createDate: new Date(), body: req.body, uid, fromEmpId: get(sessionData, 'empID'), qualityEmpId, qualitycontroller: 0, empId: qualityEmpId })
                }
                if (qualityEmpId) {
                    return res.status(201).send(writeProductionOrders({ qualitySeen: false, empSeen: false, createDate: new Date(), body: req.body, uid, fromEmpId: get(sessionData, 'empID'), qualityEmpId, qualitycontroller: 0 }))
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
                let infoNot = infoPurchase().find(item => item.uid == uid)
                if (infoNot) {
                    if (infoNot[job] == 0) {
                        if (status) {
                            updatePurchase(uid, Object.fromEntries([[job, 2]]))
                            let infoNotNew = infoPurchase().find(item => item.uid == uid)
                            let roomId = infoRoom().map(item => item.empId == infoNotNew.fromEmpId).socket

                            updatePurchase(uid, { body: { ...infoNot.body, DocumentLines } })
                            if (roomId) {
                                io.to(roomId).emit('confirmedPurchase', { ...infoNotNew, empId: infoNotNew.fromEmpId, path: "message", title: 'Поступление товаров' })
                            }
                            if (infoNotNew.qualitycontroller == 2) {
                                deletePurchase(infoNotNew.uid)
                            }
                        }
                        else {
                            let roomId = infoRoom().map(item => item.empId == infoNot.fromEmpId).socket

                            updatePurchase(uid, Object.fromEntries([[job, 1]]))
                            updatePurchase(uid, { body: { ...infoNot.body, DocumentLines } })
                            let infoNotNew = infoPurchase().find(item => item.uid == uid)
                            if (roomId) {
                                io.to(roomId).emit('notconfirmedPurchase', { ...infoNotNew, empId: infoNot.fromEmpId, path: "message", title: 'Поступление товаров' })
                            }
                            deletePurchase(infoNotNew.uid)
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
    async ProductionOrdersStatus(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let { status, job, uid } = req.body
                let infoNot = infoProduction().find(item => item.uid == uid)
                if (infoNot) {
                    if (infoNot[job] == 0) {
                        if (status) {
                            let roomId = infoRoom().map(item => item.empId == infoNot.fromEmpId).socket

                            updateProduction(uid, Object.fromEntries([[job, 2]]))
                            updateProduction(uid, { body: { ...infoNot.body } })
                            let infoNotNew = infoProduction().find(item => item.uid == uid)
                            if (roomId) {
                                io.to(roomId).emit('confirmedProduction', { ...infoNotNew, empId: infoNotNew.fromEmpId, path: "message", title: 'Поступление товаров' })
                            }
                            if (infoNotNew.qualitycontroller == 2) {
                                deleteProductionOrders(infoNotNew.uid)
                            }
                        }
                        else {
                            let room = infoRoom().map(item => item.empId == infoNot.fromEmpId).socket
                            updateProduction(uid, Object.fromEntries([[job, 1]]))
                            updateProduction(uid, { body: { ...infoNot.body } })
                            let infoNotNew = infoProduction().find(item => item.uid == uid)
                            if (room) {

                                io.to(room).emit('notConfirmedProduction', { ...infoNotNew, empId: infoNotNew.fromEmpId, path: "message", title: 'Поступление товаров' })
                            }
                            deleteProductionOrders(infoNotNew.uid)
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
                let notification;
                if (sessionData.jobTitle == "wrhmanager") {
                    notification = infoPurchase().filter(item => item?.fromEmpId == sessionData?.empID).sort((a, b) => a.empSeen - b.empSeen)
                }
                else {
                    notification = infoPurchase().filter(item => item?.qualityEmpId == sessionData?.empID).sort((a, b) => a.qualitySeen - b.qualitySeen)
                }
                let actNotification = notification
                notification = notification.slice(skip, +skip + 20)
                if (notification.length) {
                    let list = sessionData.jobTitle == "wrhmanager" ? notification.filter(item => item.empSeen == false).map(item => item.uid) : notification.filter(item => item.qualitySeen == false).map(item => item.uid)
                    updatePurchaseTrue(list, sessionData.jobTitle)
                    let len = notification.length
                    let slLen = actNotification.slice(skip, +skip + 21).length
                    notification = { data: notification, nextPage: (len != slLen ? (+skip + 20) : - 1) }
                }

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
    async ProductionOrdersGet(req, res, next) {
        try {
            delete req.headers.host
            delete req.headers['content-length']
            const sessionId = req.cookies['B1SESSION'];
            let { skip = 0 } = req.query
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let notification;
                if (sessionData.jobTitle == "prodmanager") {
                    notification = infoProduction().filter(item => item?.fromEmpId == sessionData?.empID).sort((a, b) => a.empSeen - b.empSeen)
                }
                else {
                    notification = infoProduction().filter(item => item?.qualityEmpId == sessionData?.empID).sort((a, b) => a.qualitySeen - b.qualitySeen)
                }

                let actNotification = notification
                notification = notification.slice(skip, +skip + 20)
                if (notification.length) {
                    let list = sessionData.jobTitle == "prodmanager" ? notification.filter(item => item.empSeen == false).map(item => item.uid) : notification.filter(item => item.qualitySeen == false).map(item => item.uid)
                    updateProductionTrue(list, sessionData.jobTitle)
                    let len = notification.length
                    let slLen = actNotification.slice(skip, +skip + 21).length
                    notification = { data: notification, nextPage: (len != slLen ? (+skip + 20) : - 1) }
                }
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

    async ReturnItemStock(req, res, next) {
        try {
            let GetItem = await GetItemStock(req, res, next)
            if (GetItem.status) {
                return res.status(200).json(GetItem.data)
            }
            else {
                return res.status(404).json(GetItem.message)
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


