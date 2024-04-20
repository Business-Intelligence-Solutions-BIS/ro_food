const { CREDENTIALS } = require('../credentials')
const Axios = require('axios')
const https = require('https')
const {
	findSession,
	findUserPermissions,
	updateEmpWrh,
	infoNotification,
	infoMessage,
	infoPurchase,
	infoProduction,
	saveSession,
	deleteSession,
} = require('../helpers')
const { get, groupBy } = require('lodash')
const { setEngine } = require('crypto')

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
			const url =
				data.url +
				`EmployeesInfo?$filter=EmployeeCode eq '${UserName}' and ExternalEmployeeNumber eq '${Password}'&$select=EmployeeID`
			// const url = data.url + `EmployeesInfo?$filter=JobTitle eq '${UserName}' and OfficePhone  eq '${Password}'&$select=EmployeeID`
			const resp = await Axios.get(url, config)

			if (!resp.data.value.length) {
				return {
					status: 401,
					data: 'Wrong UserName or Password.',
				}
			}

			if (Password.length < 8) {
				return {
					status: 401,
					data: 'Password is too short, please update it. Minimum length is 8 characters.',
				}
			}

			if (!/\d/.test(Password)) {
				return {
					status: 401,
					data: 'Password must contain at least one digit.',
				}
			}

			if (Password.toUpperCase() == Password) {
				return {
					status: 401,
					data: 'Password must contain at least one lowercase letter.',
				}
			}

			if (Password.toLowerCase() == Password) {
				return {
					status: 401,
					data: 'Password must contain at least one uppercase letter.',
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
			baseURL: 'https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/',
			timeout: 30000,
			headers,
			httpsAgent: new https.Agent({
				rejectUnauthorized: false,
			}),
		})
		const replydv = await axios.get(
			'https://su26-02.sb1.cloud/ServiceLayer/b1s/v2/$crossjoin(EmployeesInfo, skladlar_obyekt)?$expand=EmployeesInfo($select=EmployeeID,FirstName,LastName,SalesPersonCode,JobTitle),skladlar_obyekt($select=U_Sklad_udt,)&$filter=EmployeesInfo/U_Sklad eq skladlar_obyekt/DocEntry and EmployeesInfo/EmployeeID eq ' +
				empID,
		)
		return replydv
	}

	userData = async (req, res, next) => {
		// console.log("Malumot yetib keldi...........")
		try {
			const sessionId = req.cookies['B1SESSION']
			// console.log(sessionId)
			const sessionData = findSession(sessionId)
			// console.log(sessionData)
			if (!sessionData) {
				return res.status(401).send()
			}
			// console.log("Malumot yetib keldi")
			// console.log("session: ", JSON.stringify(sessionData))
			try {
				const ret = await this.getUserInfo(req, sessionData)
				// if (ret.EmployeesInfo.JobTitle !== "wrhmanager") {
				//  res.status(403).json({
				//     status: 403,
				//     data: "You do not have permission",
				//     });
				//     return;
				// }
				updateEmpWrh({
					empID: get(ret, 'EmployeesInfo.EmployeeID'),
					wrh: get(ret, 'CustomBranches.U_Warehouse'),
					jobTitle: get(ret, 'EmployeesInfo.JobTitle'),
				})
				return res.status(200).json(ret)
			} catch (err) {
				return res
					.status(err?.response?.status || 400)
					.json(err?.response?.data || err)
			}
		} catch (e) {
			return next(e)
		}
	}

	webUserData = async (req, res, next) => {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (!sessionData) {
				return res.status(401).send()
			}
			try {
				const ret = await this.getUserInfo(req, sessionData)

				// if (ret.EmployeesInfo.JobTitle !== "prodmanager") {
				//  res.status(403).json({
				//     status: 403,
				//     data: "You do not have permission",
				//     });
				//     return;
				// }
				updateEmpWrh({
					empID: get(ret, 'EmployeesInfo.EmployeeID'),
					wrh: get(ret, 'CustomBranches.U_Warehouse'),
					jobTitle: get(ret, 'EmployeesInfo.JobTitle'),
				})
				return res.status(200).json(ret)
			} catch (err) {
				return res
					.status(err?.response?.status || 400)
					.json(err?.response?.data || err)
			}
		} catch (e) {
			return next(e)
		}
	}

	getBatch = async (token) => {
		try {
			const sessionData = findSession(token)
			const body = `--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 1 

GET /b1s/v1/PurchaseOrders/$count?$filter=DocumentsOwner eq ${sessionData.empID} and U_typeorder eq  'Местный' and U_zav_seen eq 'false' and U_status_zakupka eq  'new_zakupka' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c 

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 2 

GET /b1s/v1/PurchaseOrders/$count?$filter=DocumentsOwner eq ${sessionData.empID} and U_typeorder eq  'Местный' and U_zav_seen eq 'false' and U_status_zakupka eq  'ready_for_otk1' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 3

GET /b1s/v1/PurchaseOrders/$count?$filter=DocumentsOwner eq ${sessionData.empID} and U_typeorder eq  'Местный' and U_zav_seen eq 'false' and U_status_zakupka eq  'checked_otk1' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 4

GET /b1s/v1/PurchaseInvoices/$count?$filter=DocumentsOwner eq ${sessionData.empID} and U_zav_seen eq 'false' and U_typeorder eq  'Местный' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--`
			const axios = Axios.create({
				baseURL: 'https://su26-02.sb1.cloud',
				timeout: 30000,
				headers: {
					'Content-Type':
						'multipart/mixed;boundary=batch_36522ad7-fc75-4b56-8c71-56071383e77c',
					Cookie: `B1SESSION=${token}; ROUTEID=.node2`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
			})
			return axios
				.post('/ServiceLayer/b1s/v2/$batch', body)
				.then(({ data }) => {
					return { status: true, data }
				})
				.catch(async (err) => {
					return { status: false, message: get(err, 'response.data', 'error') }
				})
		} catch (e) {
			return { status: false, message: e }
		}
	}

	getBatchInventory = async (token) => {
		try {
			const sessionData = findSession(token)
			const body = `--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 1 

GET /b1s/v1/InventoryTransferRequests/$count?$filter=DocumentStatus eq 'bost_Open' and U_zapros_zav_a_seen eq 'false' and FromWarehouse eq '${sessionData.wrh}' and U_zapros_status eq 'zapros_new'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c 

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 2

GET /b1s/v1/InventoryTransferRequests/$count?$filter=DocumentStatus eq 'bost_Open' and U_zapros_zav_b_seen eq 'false' and ToWarehouse eq '${sessionData.wrh}' and U_zapros_status eq 'zapros_checked'&$orderby=DocEntry desc 

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 3

GET /b1s/v1/StockTransfers/$count?$filter=DocumentStatus eq 'bost_Open' and (U_zapros_zav_a_seen eq 'false' or U_zapros_zav_b_seen eq 'false') and (FromWarehouse eq '${sessionData.wrh}' or ToWarehouse eq '${sessionData.wrh}')&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--`
			const axios = Axios.create({
				baseURL: 'https://su26-02.sb1.cloud',
				timeout: 30000,
				headers: {
					'Content-Type':
						'multipart/mixed;boundary=batch_36522ad7-fc75-4b56-8c71-56071383e77c',
					Cookie: `B1SESSION=${token}; ROUTEID=.node2`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
			})
			return axios
				.post('/ServiceLayer/b1s/v2/$batch', body)
				.then(({ data }) => {
					return { status: true, data }
				})
				.catch(async (err) => {
					return { status: false, message: get(err, 'response.data', 'error') }
				})
		} catch (e) {
			return { status: false, message: e }
		}
	}
	getBatchInventoryQuality = async (token) => {
		try {
			const sessionData = findSession(token)
			const body = `--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 1 

GET /b1s/v1/InventoryTransferRequests/$count?$filter=DocumentStatus eq 'bost_Open' and U_zapros_status eq 'zapros_otk_process'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c`
			const axios = Axios.create({
				baseURL: 'https://su26-02.sb1.cloud',
				timeout: 30000,
				headers: {
					'Content-Type':
						'multipart/mixed;boundary=batch_36522ad7-fc75-4b56-8c71-56071383e77c',
					Cookie: `B1SESSION=${token}; ROUTEID=.node2`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
			})
			return axios
				.post('/ServiceLayer/b1s/v2/$batch', body)
				.then(({ data }) => {
					return { status: true, data }
				})
				.catch(async (err) => {
					return { status: false, message: get(err, 'response.data', 'error') }
				})
		} catch (e) {
			return { status: false, message: e }
		}
	}

	getBatchQuality = async (token) => {
		try {
			const sessionData = findSession(token)
			const body = `--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 1 

GET /b1s/v1/PurchaseOrders/$count?$filter=U_otk_seen eq 'false' and U_typeorder eq  'Местный' and U_status_zakupka eq  'ready_for_otk1' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c 

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 2 

GET /b1s/v1/PurchaseOrders/$count?$filter=U_otk_seen eq 'false' and U_typeorder eq  'Местный' and U_status_zakupka eq  'ready_for_otk2' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--`

			const axios = Axios.create({
				baseURL: 'https://su26-02.sb1.cloud',
				timeout: 30000,
				headers: {
					'Content-Type':
						'multipart/mixed;boundary=batch_36522ad7-fc75-4b56-8c71-56071383e77c',
					Cookie: `B1SESSION=${token}; ROUTEID=.node2`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
			})
			return axios
				.post('/ServiceLayer/b1s/v2/$batch', body)
				.then(({ data }) => {
					return { status: true, data }
				})
				.catch(async (err) => {
					return { status: false, message: get(err, 'response.data', 'error') }
				})
		} catch (e) {
			return { status: false, message: e }
		}
	}
	getBatchProdManagerProduction = async (token) => {
		try {
			const sessionData = findSession(token)
			const body = `--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 1 

GET /b1s/v1/ProductionOrders/$count?$filter=U_proizvod_status eq 'proizvod_status_new' and Warehouse eq '${sessionData.wrh}' and ProductionOrderStatus eq 'boposReleased' and U_proizvod_nach_seen eq  'false'

--batch_36522ad7-fc75-4b56-8c71-56071383e77c 

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 2 

GET /b1s/v1/InventoryGenEntries/$count?$filter=U_proizvod_postuplenya_seen eq 'false' and U_proizvod_postuplenya_sklad eq '${sessionData.wrh}' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--`

			const axios = Axios.create({
				baseURL: 'https://su26-02.sb1.cloud',
				timeout: 30000,
				headers: {
					'Content-Type':
						'multipart/mixed;boundary=batch_36522ad7-fc75-4b56-8c71-56071383e77c',
					Cookie: `B1SESSION=${token}; ROUTEID=.node2`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
			})
			return axios
				.post('/ServiceLayer/b1s/v2/$batch', body)
				.then(({ data }) => {
					return { status: true, data }
				})
				.catch(async (err) => {
					return { status: false, message: get(err, 'response.data', 'error') }
				})
		} catch (e) {
			return { status: false, message: e }
		}
	}

	getBatchQualityControllerProduction = async (token) => {
		try {
			const body = `--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 1 

GET /b1s/v1/ProductionOrders/$count?$filter=U_proizvod_status eq 'proizvod_status_otk' and ProductionOrderStatus eq 'boposReleased' and U_proizvod_otk_seen eq 'false'

--batch_36522ad7-fc75-4b56-8c71-56071383e77c

Content-Type: application/http 
Content-Transfer-Encoding: binary 
Content-ID: 2 

GET /b1s/v1/InventoryGenEntries/$count?$filter=U_proizvod_postuplenya_seen eq 'false' and DocumentStatus eq 'bost_Open'&$orderby=DocEntry desc

--batch_36522ad7-fc75-4b56-8c71-56071383e77c--`

			const axios = Axios.create({
				baseURL: 'https://su26-02.sb1.cloud',
				timeout: 30000,
				headers: {
					'Content-Type':
						'multipart/mixed;boundary=batch_36522ad7-fc75-4b56-8c71-56071383e77c',
					Cookie: `B1SESSION=${token}; ROUTEID=.node2`,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
			})
			return axios
				.post('/ServiceLayer/b1s/v2/$batch', body)
				.then(({ data }) => {
					return { status: true, data }
				})
				.catch(async (err) => {
					return { status: false, message: get(err, 'response.data', 'error') }
				})
		} catch (e) {
			return { status: false, message: e }
		}
	}

	menu = async (req, res, next) => {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (!sessionData) {
				return res.status(401).send()
			}
			let newS = 0
			let read_otk = 0
			let checked_otk = 0
			let falseS = 0

			let inventory1 = 0
			let inventory2 = 0
			let inventory4 = 0

			const productionOrderC = 0
			if (sessionData.jobTitle == 'wrhmanager') {
				const info = await this.getBatch(sessionData.SessionId)
				if (info?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = info.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					newS = countList[0]
					read_otk = countList[1]
					checked_otk = countList[2]
					falseS = countList[3]
				}
			}

			if (
				sessionData.jobTitle == 'prodmanager' ||
				sessionData.jobTitle == 'wrhmanager'
			) {
				const infoInventory = await this.getBatchInventory(
					sessionData.SessionId,
				)
				if (infoInventory?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = infoInventory.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					inventory1 = countList[0]
					inventory2 = countList[1]
					inventory4 = countList[2]
				}
			}

			let qualityReady1P = 0
			let qualityReady2P = 0
			let inventoryQuality = 0
			if (sessionData.jobTitle == 'qualitycontroller') {
				const info = await this.getBatchQuality(sessionData.SessionId)
				if (info?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = info.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					qualityReady1P = countList[0]
					qualityReady2P = countList[1]
				}

				const infoInventory = await this.getBatchInventoryQuality(
					sessionData.SessionId,
				)
				if (infoInventory?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = infoInventory.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					inventoryQuality = countList[0]
				}
			}

			let prodOneMenu1 = 0
			let prodOneMenu2 = 0
			let qualityOneMenu = 0

			if (sessionData.jobTitle == 'prodmanager') {
				const infoPr = await this.getBatchProdManagerProduction(
					sessionData.SessionId,
				)
				if (infoPr?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = infoPr.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					prodOneMenu1 = +countList[0]
					prodOneMenu2 = +countList[1]
				}
			}

			if (sessionData.jobTitle == 'qualitycontroller') {
				const infoPr = await this.getBatchQualityControllerProduction(
					sessionData.SessionId,
				)
				if (infoPr?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = infoPr.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					qualityOneMenu = +countList[0]
				}
			}

			try {
				const obj = {
					wrhmanager: [
						{
							title: 'Закупки',
							newMessage: newS + read_otk + checked_otk + falseS != 0,
							path: 'purchaseMenu',
						},
						{
							title: 'Перемещение запасов',
							newMessage: +inventory1 + +inventory2 + +inventory4 != 0,
							path: 'inventoryTransferMenu',
						},
						{
							title: 'Продажа',
							newMessage: false,
						},
					],
					qualitycontroller: [
						{
							title: 'Производственные заказы',
							newMessage: +qualityOneMenu > 0,
							path: 'productionOrdersMenu',
						},
						{
							title: 'Закупки',
							newMessage: +qualityReady1P + +qualityReady2P != 0,
							path: 'purchaseMenu',
						},
						{
							title: 'Перемещение запасов',
							newMessage: +inventoryQuality != 0,
							path: 'inventoryTransferMenu',
						},
					],
					prodmanager: [
						{
							title: 'Производственные заказы',
							newMessage: +prodOneMenu1 + +prodOneMenu2 > 0,
							path: 'productionOrdersMenu',
						},
						{
							title: 'Перемещение запасов',
							newMessage: +inventory1 + +inventory2 + +inventory4 != 0,
							path: 'inventoryTransferMenu',
						},
					],
				}
				return res.status(200).json(obj[sessionData.jobTitle])
			} catch (err) {
				return res
					.status(err?.response?.status || 400)
					.json(err?.response?.data || err)
			}
		} catch (e) {
			return next(e)
		}
	}

	GetItemStock = async (req, res, next) => {
		try {
			const { itemCode, whs } = req.query
			delete req.headers.host
			delete req.headers['content-length']
			const authKey = `Basic ${Buffer.from(
				'llc_res_su26_adm:Kiw1bEW0P354',
			).toString('base64')}`
			const axios = Axios.create({
				baseURL: 'https://su26-02.sb1.cloud:4300',
				timeout: 30000,
				headers: {
					Authorization: authKey,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
			})
			return axios
				.get(`/Exact/index.xsjs?itemCode=${itemCode}&whs=${whs}`)
				.then(({ data }) => {
					return { status: true, data }
				})
				.catch(async (err) => {
					return { status: false, message: get(err, 'response.data', 'error') }
				})
		} catch (e) {
			return next(e)
		}
	}

	purchaseMenu = async (req, res, next) => {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (!sessionData) {
				return res.status(401).send()
			}
			let newS = 0
			let read_otk = 0
			let checked_otk = 0
			let falseS = 0

			if (sessionData.jobTitle == 'wrhmanager') {
				const info = await this.getBatch(sessionData.SessionId)
				if (info?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = info.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					newS = countList[0]
					read_otk = countList[1]
					checked_otk = countList[2]
					falseS = countList[3]
				}
			}

			let qualityReady1P = 0
			let qualityReady2P = 0
			if (sessionData.jobTitle == 'qualitycontroller') {
				const info = await this.getBatchQuality(sessionData.SessionId)
				if (info?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = info.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					qualityReady1P = countList[0]
					qualityReady2P = countList[1]
				}
			}

			try {
				const obj = {
					wrhmanager: [
						{
							title: 'Заказ на закупку',
							newMessage: +newS != 0,
							path: 'purchaseOrder',
						},
						// {
						//     title: 'В ожидании проверки OTK N1',
						//     newMessage: +read_otk != 0,
						//     path: 'pendingVerification'
						// },
						// {
						//     title: 'Проверенные',
						//     newMessage: +checked_otk != 0,
						//     path: 'verified'
						// },
						// {
						//     title: 'В ожидании проверки OTK N1',
						//     newMessage: false,
						//     path: 'pendingVerification2'
						// },
						{
							title: 'Завершенные закупки',
							newMessage: +falseS != 0,
							path: 'purchaseCompletion',
						},
					],
					qualitycontroller: [
						{
							title: 'В ожидании проверки OTK N1',
							newMessage: +qualityReady1P != 0,
							path: 'verifiedOTK',
						},
						{
							title: 'Проверенные OTK N1',
							newMessage: false,
							path: 'menu2OTK',
						},
						{
							title: 'В ожидании проверки OTK N2',
							newMessage: +qualityReady2P != 0,
							path: 'menu3OTK',
						},
						{
							title: 'Проверенные OTK N2',
							newMessage: false,
							path: 'menu4OTK',
						},
					],
					prodmanager: [
						{
							title: 'Заказ на закупку',
							newMessage: +newS != 0,
							path: 'purchaseOrder',
						},
						{
							title: 'В ожидании проверки OTK N1',
							newMessage: +read_otk != 0,
							path: 'pendingVerification',
						},
						{
							title: 'Проверенные',
							newMessage: +checked_otk != 0,
							path: 'verified',
						},
						{
							title: 'В ожидании проверки OTK N1',
							newMessage: false,
							path: 'pendingVerification2',
						},
						{
							title: 'Завершенные закупки',
							newMessage: +falseS != 0,
							path: 'purchaseCompletion',
						},
					],
				}
				return res.status(200).json(obj[sessionData.jobTitle])
			} catch (err) {
				return res
					.status(err?.response?.status || 400)
					.json(err?.response?.data || err)
			}
		} catch (e) {
			return next(e)
		}
	}

	productionMenu = async (req, res, next) => {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (!sessionData) {
				return res.status(401).send()
			}

			let prodOneMenu1 = 0
			let prodOneMenu2 = 0
			let qualityOneMenu = 0

			if (sessionData.jobTitle == 'prodmanager') {
				const infoPr = await this.getBatchProdManagerProduction(
					sessionData.SessionId,
				)
				if (infoPr?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = infoPr.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					prodOneMenu1 = +countList[0]
					prodOneMenu2 = +countList[1]
				}
			}

			if (sessionData.jobTitle == 'qualitycontroller') {
				const infoPr = await this.getBatchQualityControllerProduction(
					sessionData.SessionId,
				)
				if (infoPr?.status) {
					const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
					const match = infoPr.data.match(regexPattern)
					const countList = match.map((item) =>
						item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
					)
					qualityOneMenu = +countList[0]
				}
			}

			try {
				const obj = {
					qualitycontroller: [
						{
							title: 'В ожидании проверки',
							newMessage: qualityOneMenu > 0,
							path: 'bossPendingVerification3OTK',
						},
						{
							title: 'Проверенные',
							newMessage: false,
							path: 'bossCompleted4OTK',
						},
					],
					prodmanager: [
						{
							title: 'Открытые',
							newMessage: prodOneMenu1 > 0,
							path: 'bossOpen1',
						},
						{
							title: 'В процессе',
							newMessage: false,
							path: 'bossInProgress2',
						},
						{
							title: 'В ожидании проверки',
							newMessage: false,
							path: 'bossPendingVerification3',
						},
						{
							title: 'Завершенные',
							newMessage: prodOneMenu2 > 0,
							path: 'bossCompleted4',
						},
					],
				}
				return res.status(200).json(obj[sessionData.jobTitle])
			} catch (err) {
				return res
					.status(err?.response?.status || 400)
					.json(err?.response?.data || err)
			}
		} catch (e) {
			return next(e)
		}
	}

	socketTrigger = (req, res, next) => {
		if (req === 'PURCHASE_ORDERS') {
		}
	}

	inventoryMenu = async (req, res, next) => {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (!sessionData) {
				return res.status(401).send()
			}

			let inventory1 = 0
			let inventory2 = 0
			let inventory4 = 0
			// if (sessionData.jobTitle == "prodmanager" || sessionData.jobTitle == "wrhmanager") {
			const infoInventory = await this.getBatchInventory(sessionData.SessionId)
			if (infoInventory?.status) {
				const regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g
				const match = infoInventory.data.match(regexPattern)
				const countList = match.map((item) =>
					item.replace(/OData-Version: 4.0\r\n\r\n/g, ''),
				)
				inventory1 = countList[0]
				inventory2 = countList[1]
				inventory4 = countList[2]
			}
			// }

			// let inventoryQuality = 0
			// if (sessionData.jobTitle == "qualitycontroller") {
			//     let infoInventory = await this.getBatchInventoryQuality(sessionData.SessionId)
			//     if (infoInventory?.status) {
			//         let regexPattern = /OData-Version: 4\.0[^0-9]*([0-9]+\.?[0-9]*)/g;
			//         let match = infoInventory.data.match(regexPattern);
			//         let countList = match.map(item => item.replace(/OData-Version: 4.0\r\n\r\n/g, ''))
			//         inventoryQuality = countList[0]
			//     }
			// }

			try {
				const obj = {
					// 'qualitycontroller': [
					//     {
					//         title: 'В проверке ОТК',
					//         newMessage: +inventoryQuality > 0,
					//         path: 'inventoryPendingQuality'
					//     },
					//     {
					//         title: 'Проверенные',
					//         newMessage: false,
					//         path: 'inQualityControlInspection'
					//     },
					//     {
					//         title: 'Проверенные перемещения',
					//         newMessage: false,
					//         path: "inventoryComplatedQuality"
					//     }
					// ],
					wrhmanager: [
						{
							title: 'Запросы на перемещения',
							newMessage: +inventory1 > 0,
							path: 'relocationRequests',
						},
						{
							title: 'Исходящие перемещения в ожидании',
							newMessage: false,
							path: 'outgoingMovementsPending',
						},
						{
							title: 'Входящие перемещения в ожидании',
							newMessage: +inventory2 > 0,
							path: 'incomingMovementsPending',
						},
						{
							title: 'Завершенные перемещения',
							newMessage: +inventory4 > 0,
							path: 'completedMovements',
						},
					],
					// 'prodmanager': [
					//     {
					//         title: 'Запросы на перемещения',
					//         newMessage: +inventory1 > 0,
					//         path: 'relocationRequests'
					//     },
					//     {
					//         title: 'Исходящие перемещения в ожидании',
					//         newMessage: false,
					//         path: "outgoingMovementsPending"
					//     },
					//     {
					//         title: 'Входящие перемещения в ожидании',
					//         newMessage: +inventory2 > 0,
					//         path: "incomingMovementsPending"
					//     },
					//     {
					//         title: 'Завершенные перемещения',
					//         newMessage: +inventory4 > 0,
					//         path: "completedMovements"
					//     }
					// ]
				}
				return res.status(200).json(obj['wrhmanager'])
			} catch (err) {
				return res
					.status(err?.response?.status || 400)
					.json(err?.response?.data || err)
			}
		} catch (e) {
			return next(e)
		}
	}
}

module.exports = new CustomController()
