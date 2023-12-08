const { CREDENTIALS } = require("../credentials");
const Axios = require("axios");
const https = require("https");
const { findSession, findUserPermissions, updateEmpWrh, infoNotification, infoMessage } = require("../helpers");
const { get, groupBy } = require("lodash");

class CustomController {
    async uiLogin({ UserName, Password, Company }) {
        const data = CREDENTIALS[Company];
        if (!Password) {
            return {
                status: 401,
                data: "No password provided."
            }
        }

        if (!data) {
            return {
                status: 401,
                data: "Wrong Company."
            }
        }

        const UserName_ = JSON.stringify({
            UserName: data.credentials.UserName,
            CompanyDB: data.credentials.CompanyDB,
        })

        const base64token = Buffer.from(UserName_ + ':' + data.credentials.Password).toString('base64')

        const config = {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
            headers: {
                Authorization: 'Basic ' + base64token
            }
        }

        try {
            const url = data.url + `EmployeesInfo?$filter=EmployeeCode eq '${UserName}' and ExternalEmployeeNumber eq '${Password}'&$select=EmployeeID`

            const resp = await Axios.get(url, config)

            if (!resp.data.value.length) {
                return {
                    status: 401,
                    data: "Wrong UserName or Password."
                }
            }

            if (Password.length < 8) {
                return {
                    status: 401,
                    data: "Password is too short, please update it. Minimum length is 8 characters."
                }
            }

            if (!/\d/.test(Password)) {
                return {
                    status: 401,
                    data: "Password must contain at least one digit."
                }
            }

            if (Password.toUpperCase() == Password) {
                return {
                    status: 401,
                    data: "Password must contain at least one lowercase letter."
                }
            }

            if (Password.toLowerCase() == Password) {
                return {
                    status: 401,
                    data: "Password must contain at least one uppercase letter."
                }
            }

            const resp2 = await Axios.post(
                data.url + 'Login',
                data.credentials,
                {
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (resp2.status !== 200) {
                return {
                    status: 401,
                    data: "Wrong API UserName or Password."
                }
            }

            return {
                headers: resp2.headers,
                status: 200,
                data: resp2.data,
                userData: resp?.data?.value[0]
            }
        } catch (e) {
            return {
                headers: e.response.headers,
                status: e.response.status,
                data: e.response.data
            }
        }
    }

    getUserInfo = async ({ headers }, { empID }) => {
        const permissions = await findUserPermissions(empID)
        const branchInfo = await this.getUserBranchInfo(headers, empID)
        return {
            ...branchInfo.data.value[0],
            Permissions: permissions,
        }
    }

    getUserBranchInfo = async (headers, empID) => {
        delete headers.host
        delete headers['content-length']
        const axios = Axios.create({
            baseURL: "https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/",
            timeout: 30000,
            headers,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
        return await axios.get("https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/$crossjoin(EmployeesInfo, CustomBranches)?$expand=EmployeesInfo($select=EmployeeID,FirstName,LastName,SalesPersonCode,JobTitle),CustomBranches($select=DocEntry,U_Name,U_CashAccountUzs,U_CashAccountUsd,U_CardAccount,U_TransAccount,U_Warehouse)&$filter=EmployeesInfo/U_Branch eq CustomBranches/DocEntry and EmployeesInfo/EmployeeID eq " + empID)
    }

    userData = async (req, res, next) => {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (!sessionData) {
                return res.status(401).send()
            }
            try {
                const ret = await this.getUserInfo(req, sessionData)
                updateEmpWrh({ empID: get(ret, 'EmployeesInfo.EmployeeID'), wrh: get(ret, 'CustomBranches.U_Warehouse'), jobTitle: get(ret, 'EmployeesInfo.JobTitle') })
                return res.status(200).json(ret);
            }
            catch (err) {
                return res.status(err?.response?.status || 400).json(err?.response?.data || err)
            }

        }
        catch (e) {
            return next(e)
        }
    }
    notification = async (req, res, next) => {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            let { skip = 0, api } = req.query
            if (!sessionData) {
                return res.status(401).send()
            }
            if (!api) {
                return res.status(404).send({ message: 'Api not found' })
            }

            try {
                let notification = []
                if (sessionData?.jobTitle == 'qualitycontroller') {
                    notification = infoNotification().filter(item => item?.qualityEmpId == sessionData.empID && item?.api == api)
                }
                else if (sessionData?.jobTitle == 'wrhmanager') {
                    notification = infoNotification().filter(item => item?.toEmpId == sessionData.empID && item?.api == api)
                }
                let actNotification = notification
                notification = notification.slice(skip, +skip + 20)
                let len = notification.length
                let slLen = actNotification.slice(skip, +skip + 21).length
                notification = { data: notification, nextPage: (len != slLen ? (+skip + 20) : - 1) }
                return res.status(200).json(notification)
            }
            catch (err) {
                return res.status(err?.response?.status || 400).json(err?.response?.data || err)
            }

        }
        catch (e) {
            return next(e)
        }
    }

    notificationMenu = async (req, res, next) => {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (!sessionData) {
                return res.status(401).send()
            }
            try {
                let obj = {
                    'StockTransfers': `Перемещение запасов`
                }
                let notification = [...new Set(infoNotification().filter(item => item?.toEmpId == sessionData.empID || item?.qualityEmpId == sessionData.empID).map(item => item.api))].map(item => {
                    return { title: obj[item], api: item }
                })
                return res.status(200).json(notification)
            }
            catch (err) {
                return res.status(err?.response?.status || 400).json(err?.response?.data || err)
            }

        }
        catch (e) {
            return next(e)
        }
    }

    async stockTransferRequest(body, token) {
        try {
            body.StockTransferLines = body.StockTransferLines.map(item => {
                delete item.ItemName
                return item
            })
            const axios = Axios.create({
                baseURL: "https://su26-02.sb1.cloud",
                timeout: 30000,
                headers: {
                    Cookie: `B1SESSION=${token}; ROUTEID=.node2`,
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            });
            return axios
                .post('/ServiceLayer/b1s/v2/StockTransfers', body)
                .then(({ data }) => {
                    return { status: true, data }
                })
                .catch(async (err) => {
                    return { status: false, message: get(err, 'response.data', 'error') }
                });
        }
        catch (e) {
            return { status: false, message: e }
        }
    }

    getBatch = async (token) => {
        try {
            const sessionData = findSession(token);
            let body = `--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 1 

GET /b1s/v1/PurchaseRequests/$count?$filter=DocumentsOwner eq ${sessionData?.empID}

--batch_36522ad7-fc75-4b56-8c71-56071383e77c 

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 2 

GET /b1s/v1/StockTransfers/$count?$select=DocEntry,Series,Printed&$filter=FromWarehouse eq '${sessionData?.wrh}'

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--
            `
            const axios = Axios.create({
                baseURL: "https://su26-02.sb1.cloud",
                timeout: 30000,
                headers: {
                    'Content-Type': "multipart/mixed;boundary=batch_36522ad7-fc75-4b56-8c71-56071383e77c",
                    'Cookie': `B1SESSION=${token}; ROUTEID=.node2`,
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            });
            return axios
                .post('/ServiceLayer/b1s/v2/$batch', body)
                .then(({ data }) => {
                    return { status: true, data }
                })
                .catch(async (err) => {
                    return { status: false, message: get(err, 'response.data', 'error') }
                });
        }
        catch (e) {
            return { status: false, message: e }
        }
    }

    menu = async (req, res, next) => {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (!sessionData) {
                return res.status(401).send()
            }
            let purchaseReqCount = 0
            let strockTransferCount = 0

            let info = await this.getBatch(sessionData.SessionId)
            if (info?.status) {
                let regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g;
                let match = info.data.match(regexPattern);
                let countList = match.map(item => item.replace(/OData-Version: 4.0\r\n\r\n/g, ''))
                purchaseReqCount = countList[0]
                strockTransferCount = countList[1]
            }
            try {
                let obj = {
                    'wrhmanager': [
                        {
                            id: 1,
                            title: 'Заявка на закупку',
                            count: purchaseReqCount,
                            path: 'purchaseRequest'
                        },
                        {
                            id: 2,
                            title: 'Перемещение запасов',
                            count: +strockTransferCount + (infoNotification().filter(item => item?.fromEmpId == sessionData?.empID && item.api == 'StockTransfers')?.length || 0),
                            path: 'inventoryTransfer'
                        },
                        {
                            id: 3,
                            title: 'Поступление товаров',
                            count: 0,
                            path: 'buy'
                        },
                        {
                            id: 4,
                            title: 'На утверждении',
                            count: infoNotification().filter(item => item?.toEmpId == sessionData?.empID)?.length || 0,
                            path: 'notificationMenu'
                        },
                        {
                            id: 5,
                            title: "Xabarlar",
                            count: infoMessage().filter(item => item.fromEmpId == sessionData?.empID)?.length || 0,
                            path: 'message'
                        }
                    ],
                    'qualitycontroller': [
                        {
                            id: 4,
                            title: 'На утверждении',
                            count: infoNotification().filter(item => item?.qualityEmpId == sessionData?.empID)?.length || 0,
                            path: 'notificationMenu'
                        }
                    ]
                }
                return res.status(200).json(obj[sessionData.jobTitle])
            }
            catch (err) {
                return res.status(err?.response?.status || 400).json(err?.response?.data || err)
            }

        }
        catch (e) {
            return next(e)
        }
    }
    message = async (req, res, next) => {
        try {
            const sessionId = req.cookies['B1SESSION'];
            const sessionData = findSession(sessionId);
            if (!sessionData) {
                return res.status(401).send()
            }

            try {
                let notification = infoMessage().filter(item => item.fromEmpId == sessionData.empID)
                let actNotification = notification
                notification = notification.slice(skip, +skip + 20)
                let len = notification.length
                let slLen = actNotification.slice(skip, +skip + 21).length
                notification = { data: notification, nextPage: (len != slLen ? (+skip + 20) : - 1) }
                return res.status(200).json(notification)
            }
            catch (err) {
                return res.status(err?.response?.status || 400).json(err?.response?.data || err)
            }

        }
        catch (e) {
            return next(e)
        }
    }


}

module.exports = new CustomController()