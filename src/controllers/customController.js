const { CREDENTIALS } = require('../credentials')
const Axios = require('axios')
const https = require('https')
const {
	findSession,
	updateEmpWrh,
} = require('../helpers')
const { get, groupBy } = require('lodash')

class CustomController {

	async uiLogin({ UserName, Password, Company }) {
		const data = CREDENTIALS[Company]
		if (!Password) {
			return {
				status: 401,
				data: 'No password provided.',
			}
		}

		if (!data) {
			return {
				status: 401,
				data: 'Wrong Company.',
			}
		}

		const UserName_ = JSON.stringify({
			UserName: data.credentials.UserName,
			CompanyDB: data.credentials.CompanyDB,
		})

		const base64token = Buffer.from(
			UserName_ + ':' + data.credentials.Password,
		).toString('base64')

		const config = {
			httpsAgent: new https.Agent({
				rejectUnauthorized: false,
			}),
			headers: {
				Authorization: 'Basic ' + base64token,
			},
		}

		try {
			
			if (Password.length < 8) {
				return {
					status: 401,
					data: 'Password is too short, please update it. Minimum length is 8 characters.',
				}
			}if (!/\d/.test(Password)) {
				return {
					status: 401,
					data: 'Password must contain at least one digit.',
				}
			}if (Password.toUpperCase() == Password) {
				return {
					status: 401,
					data: 'Password must contain at least one lowercase letter.',
				}
			}if (Password.toLowerCase() == Password) {
				return {
					status: 401,
					data: 'Password must contain at least one uppercase letter.',
				}
			}

			/// check whether user is exist or not
			const url =
				data.url +
				`EmployeesInfo?$filter=EmployeeCode eq '${UserName}' and ExternalEmployeeNumber eq '${Password}'&$select=EmployeeID`
			const resp = await Axios.get(url, config)

			if (!resp.data.value.length) {
				return {
					status: 401,
					data: 'Wrong UserName or Password.',
				}
			}

			const resp2 = await Axios.post(data.url + 'Login', data.credentials, {
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			})

			if (resp2.status !== 200) {
				return {
					status: 401,
					data: 'Wrong API UserName or Password.',
				}
			}

			return {
				headers: resp2.headers,
				status: 200,
				data: resp2.data,
				userData: resp?.data?.value[0],
			}
		} catch (e) {
			return {
				headers: e.response.headers,
				status: e.response.status,
				data: e.response.data,
			}
		}
	}

	userData = async (sessionId) => {
		try {
			const sessionData = findSession(sessionId)
			if (!sessionData) {
				return 409;
			}
			try {
				const ret = await this.getUserBranchInfo(sessionData)
				if (ret.data.value[0].EmployeesInfo.JobTitle !== "wrhmanager") {
					return 401;
				   }
				updateEmpWrh({
					empID: get(ret, 'EmployeesInfo.EmployeeID'),
					wrh: get(ret, 'CustomBranches.U_Warehouse'),
					jobTitle: get(ret, 'EmployeesInfo.JobTitle'),
				})
				return {...ret.data.value[0]};
			} catch (err) {
				console.log(err.message)
			}
		} catch (e) {
			console.log(e.message)
		}
	}

	getUserBranchInfo = async (session) => {
		const config = {
			httpsAgent: new https.Agent({
				rejectUnauthorized: false,
			}),
			headers: {
				Cookie: `B1SESSION=${session.SessionId}; ROUTEID=.node2`
			},
		}
		const url = 'https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/$crossjoin(EmployeesInfo, skladlar_obyekt)?$expand=EmployeesInfo($select=EmployeeID,FirstName,LastName,SalesPersonCode,JobTitle),skladlar_obyekt($select=U_Sklad_udt,)&$filter=EmployeesInfo/U_Sklad eq skladlar_obyekt/DocEntry and EmployeesInfo/EmployeeID eq ' +
		session.empID
		const replydv = await Axios.get(url, config)
		return replydv
	}

	webUserData = async (sessionId) => {
		try {
			const sessionData = findSession(sessionId)
			if (!sessionData) {
				return 409;
			}
			try {
				const ret = await this.getUserBranchInfo(sessionData)
				if (ret.data.value[0].EmployeesInfo.JobTitle !== "prodmanager") {
				 return 401;
				}
				updateEmpWrh({
					empID: get(ret, 'EmployeesInfo.EmployeeID'),
					wrh: get(ret, 'CustomBranches.U_Warehouse'),
					jobTitle: get(ret, 'EmployeesInfo.JobTitle'),
				})
				return {...ret.data.value[0]};
			} catch (err) {
				console.log(err.message)
			}
		} catch (e) {
			console.log(e.message)
		}

		// try {
		// 	const sessionId = req.cookies['B1SESSION']
		// 	const sessionData = findSession(sessionId)
		// 	if (!sessionData) {
		// 		return res
		// 		.status(401)
		// 		.json({status: false, message: "Session is not found"})
		// 	}

		// 	try {
		// 		const ret = await this.getUserInfo(req, sessionData)

		// 		// if (ret.EmployeesInfo.JobTitle !== "prodmanager") {
		// 		//  res.status(403).json({
		// 		//     status: 403,
		// 		//     data: "You do not have permission",
		// 		//     });
		// 		//     return;
		// 		// }
		// 		updateEmpWrh({
		// 			empID: get(ret, 'EmployeesInfo.EmployeeID'),
		// 			wrh: get(ret, 'CustomBranches.U_Warehouse'),
		// 			jobTitle: get(ret, 'EmployeesInfo.JobTitle'),
		// 		})
		// 		return res.status(200).json(ret)
		// 	} catch (err) {
		// 		return res
		// 			.status(err?.response?.status || 400)
		// 			.json(err?.response?.data || err)
		// 	}
		// } catch (e) {
		// 	return next(e)
		// }
	}
}

module.exports = new CustomController()