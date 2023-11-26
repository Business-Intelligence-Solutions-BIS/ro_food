const { CREDENTIALS } = require("../credentials");
const Axios = require("axios");
const https = require("https");
const { findSession, findUserPermissions } = require("../helpers");

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
        return await axios.get("https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/$crossjoin(EmployeesInfo, CustomBranches)?$expand=EmployeesInfo($select=EmployeeID,FirstName,LastName,SalesPersonCode),CustomBranches($select=DocEntry,U_Name,U_CashAccountUzs,U_CashAccountUsd,U_CardAccount,U_TransAccount,U_Warehouse)&$filter=EmployeesInfo/U_Branch eq CustomBranches/DocEntry and EmployeesInfo/EmployeeID eq " + empID)
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


}

module.exports = new CustomController()