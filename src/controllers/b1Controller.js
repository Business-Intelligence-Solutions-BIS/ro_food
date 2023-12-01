
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
                        if (b1Api == 'StockTransfers') {
                            const sessionId = req.cookies['B1SESSION'];
                            const sessionData = findSession(sessionId);
                            let notification = infoNotification().filter(item => item.fromEmpId == sessionData?.empID && item.api == 'StockTransfers')
                            data.value = notification?.length ? [...data.value, ...notification.body, ...notification] : data.value
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
                        path: 'notification',
                        title: 'На утверждении'
                    })
                }
                if (qualityControllerRoomId) {
                    io.to(qualityControllerRoomId.socket).emit('notification', {
                        ...req.body,
                        empId: get(sessionData, 'empID'),
                        api: 'StockTransfers',
                        path: 'notification',
                        title: 'На утверждении'
                    })
                }
                let uid = randomUUID()
                let toEmpId = infoUser().sessions.find((item) => item.wrh == get(req, 'body.ToWarehouse'))?.empID
                let qualityEmpId = infoUser().sessions.find((item) => item.jobTitle == 'qualitycontroller')?.empID
                if (toEmpId && qualityEmpId) {
                    writeNotification({ body: req.body, uid, fromEmpId: get(sessionData, 'empID'), toEmpId, qualityEmpId, api: 'StockTransfers', wrhmanager: 0, qualitycontroller: 0 })
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
    async StockTransfersStatus(req, res, next) {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (sessionData) {
                let infoNot = infoNotification().find(item => item.uid == uid)
                let { status, job, uid } = req.body
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
                                let session = infoUser().sessions.find((item) => item.empID === infoNotNew.fromEmpId)?.SessionId
                                let data = await customController.stockTransferRequest(infoNotNew.body, session)
                                if (roomId) {
                                    io.to(roomId.socket).emit('statusStockTransfer', data?.status ? { status: true, message: 'Success', path: "message", ...infoNotNew } : { status: false, message: data?.message, path: "message", ...infoNotNew })
                                }
                                if (data?.status) {
                                    writeMessage({ error: false, sap: true, ...infoNotNew })
                                    deleteNotification(infoNotNew.uid)
                                }
                                else {
                                    writeMessage({ error: true, errMessage: data?.message, sap: false, ...infoNotNew })
                                    deleteNotification(infoNotNew.uid)
                                }
                            }
                        }
                        else {
                            updateNotification(uid, Object.fromEntries([[job, 1]]))
                            let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
                            let infoNotNew = infoNotification().find(item => item.uid == uid)
                            if (roomId) {
                                io.to(roomId.socket).emit('notconfirmedStockTransfer', { ...infoNotNew, confirmed: job, path: "message", title: 'Перемещение запасов' })
                            }
                            writeMessage({ error: true, errMessage: data?.message, sap: false, ...infoNotNew })
                            deleteNotification(infoNotNew.uid)
                        }
                    }
                }
                else {
                    return res.status(404).send({ status: false, message: 'Topilmadi' })
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