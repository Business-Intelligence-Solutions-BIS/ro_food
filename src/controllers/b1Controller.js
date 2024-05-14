const Axios = require('axios')
const https = require('https')
const { get } = require('lodash')
const {
	saveSession,
	findSession,
	updateEmp,
	updateSessionToken,
} = require('../helpers')
const CustomController = require('./customController')
const userJson = require('../../database/user.json')
const messageJson = require('../../database/message.json')
const {sendNotification, sendNotification1} = require('../service/notificationService')

class b1Controller {
	async test(req, res, next) {
		try {
			return res.status(201).json('Assalamu Alaykum')
		} catch (e) {
			return next(e)
		}
	}

	async login(req, res, next) {
		try {
			const {lang, deviceId, token} = req.body;
			delete req.headers.host
			delete req.headers['content-length']
			const ret = await CustomController.uiLogin(req.body)

			if (ret.status !== 200 && ret.status !== 201) {
				return res.status(ret.status || 400).send({
					error: {
						message: ret.data,
					},
				})
			}

			if (ret.headers['set-cookie'] && ret.headers['set-cookie'][0]) {
				ret.headers['set-cookie'][0] += '; Path=/'
			}

			await saveSession({
				...ret.data,
				empID: ret.userData.EmployeeID,
				startedAt: new Date().valueOf(),
				token: token,
				lang: lang,
				deviceId: deviceId,
				active: true,
				isWeb: false
			})

			res.set({
				...ret.headers,
			})
			const userData = await CustomController.userData(ret.data.SessionId);

			if (!userData || userData === 409) {
    			return res.status(401).json({ status: false, message: "Session is not found" });
			} else if (userData === 400) {
			    return res.status(400).json({ status: false, message: "Bad request" });
			}else if(userData === 401){
				return res
				.status(401)
				.json({status: false, message: "You do not have permission web page"})	
			}else{
				userData.sessionId = ret.data.SessionId

				return res
				.status(ret.status)
				.json(userData)
			}
		} catch (e) {
			return next(e)
		}
	}

	async webLogin(req, res, next) {
		try {
			delete req.headers.host
			delete req.headers['content-length']
			const ret = await CustomController.uiLogin(req.body)

			if (ret.status !== 200 && ret.status !== 201) {
				return res.status(ret.status || 400).send({
					error: {
						message: ret.data,
					},
				})
			}

			if (ret.headers['set-cookie'] && ret.headers['set-cookie'][0]) {
				ret.headers['set-cookie'][0] += '; Path=/'
			}

			await saveSession({
				...ret.data,
				empID: ret.userData.EmployeeID,
				startedAt: new Date().valueOf(),
				active: true,
				isWeb: true
			})

			res.set({
				...ret.headers,
			})
			const userData = await CustomController.webUserData(ret.data.SessionId);

			if (!userData || userData === 409) {
    			return res.status(401).json({ status: false, message: "Session is not found" });
			} else if (userData === 400) {
			    return res.status(400).json({ status: false, message: "Bad request" });
			}else if(userData === 401){
				return res
				.status(401)
				.json({status: false, message: "You do not have permission web page"})	
			}
			else{
				userData.sessionId = ret.data.SessionId

				return res
				.status(ret.status)
				.json(userData)
			}
		} catch (e) {
			return next(e)
		}
	}

	async getItemsByGroups(req, res, next) {
		try {
			// Extracting query parameters
			const {
				ParentGroup, 
				ItemCode,
				ItemName,
				SubGroup,
				SubSubGroup,
				maxpagesize = 10,
			} = req.query

			// Constructing the URL with query parameters
			let url =
				'https://su26-02.sb1.cloud:4300/RoFood/app.xsjs/getItemsByGroups?'
			if (ParentGroup) url += `ParentGroup=${ParentGroup}&`
			if (ItemCode) url += `ItemCode=${ItemCode}&`
			if (ItemName) url += `ItemName=%25${ItemName}%25&` // Encoding the ItemName
			if (SubGroup) url += `SubGroup=${SubGroup}&`
			if (SubSubGroup) url += `SubSubGroup=${SubSubGroup}&`
			url = url.slice(0, -1) // Remove the trailing '&' if present

			const config = {
				method: 'get',
				url,
				headers: {
					Prefer: 'odata.maxpagesize=' + maxpagesize,
				},
				auth: {
					username: 'llc_res_su26_adm',
					password: 'Kiw1bEW0P354',
				},
			}

			// Making the request
			const response = await Axios(config)

			// Returning the data received from the API
			res.status(200).json(response.data)
		} catch (error) {
			next(error)
		}
	}

	async get(req, res, next) {
		try {
			const { b1Api } = req.params
			delete req.headers.host
			delete req.headers['content-length']
			if (b1Api) {
				const axios = Axios.create({
					baseURL: 'https://su26-02.sb1.cloud',
					timeout: 30000,
					headers: req.headers,
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
					}),
				})
				return axios
					.get(req.originalUrl)
					.then(({ data }) => {
						if (
							['PurchaseOrders', 'PurchaseInvoices', 'SQLQueries'].includes(
								b1Api,
							) &&
							data?.value?.length
						) {
							const sessionId = req.cookies['B1SESSION']
							const sessionData = findSession(sessionId)
							const docEntryLists = data.value
								.map((item) => item.DocEntry)
								.filter((item) => item > get(sessionData, `${b1Api}`, 0))
							if (docEntryLists?.length) {
								data.value = data.value.map((item) => {
									return {
										...item,
										empSeen:
											item.DocEntry > get(sessionData, `${b1Api}`, 0)
												? false
												: true,
									}
								})
								const max = Math.max(...docEntryLists)
								updateEmp(
									sessionData?.empID,
									Object.fromEntries([[b1Api, max]]),
								)
							}
						}
						return res.status(200).json(data)
					})
					.catch(async (err) => {
						return res
							.status(get(err, 'response.status', 500))
							.json(get(err, 'response.data', `Error`))
					})
			}
			return res
				.status(404)
				.json({ status: false, message: 'B1 Api not found' })
		} catch (e) {
			console.log('erroor in 404 and exception')
			return next(e)
		}
	}

	async post(req, res, next) {
		try {
			const { b1Api } = req.params
			delete req.headers.host
			delete req.headers['content-length']
			if (b1Api) {
				const axios = Axios.create({
					baseURL: 'https://su26-02.sb1.cloud',
					timeout: 30000,
					headers: req.headers,
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
					}),
				})
				return axios
					.post(req.originalUrl, req.body)
					.then(({ data }) => {
						return res.status(201).json(data)
					})
					.catch(async (err) => {
						return res
							.status(get(err, 'response.status', 500))
							.json(get(err, 'response.data', `Error`))
					})
			}
			return res
				.status(404)
				.json({ status: false, message: 'B1 Api not found' })
		} catch (e) {
			return next(e)
		}
	}

	async patch(req, res, next) {
		try {
			const { b1Api } = req.params
			delete req.headers.host
			delete req.headers['content-length']
			if (b1Api) {
				const axios = Axios.create({
					baseURL: 'https://su26-02.sb1.cloud',
					timeout: 30000,
					headers: req.headers,
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
					}),
				})
				return axios
					.patch(req.originalUrl, req.body)
					.then(({ data }) => {
						return res.status(204).json(data)
					})
					.catch(async (err) => {
						return res
							.status(get(err, 'response.status', 500))
							.json(get(err, 'response.data', `Error`))
					})
			}
			return res
				.status(404)
				.json({ status: false, message: 'B1 Api not found' })
		} catch (e) {
			return next(e)
		}
	}

	async updateUserLang(req, res, next){
		try{	
		const { lang, empId } = req.body;

		if (!empId) {
			return res
				.status(409)
				.json({ status: false, message: 'Employee Id is invalid' })
		}
			const sessions = [...userJson.sessions];
			// const sessions = userJson.sessions

			const sessionIndex = sessions.findIndex((item) => item.empID == empId);

			if (sessionIndex === -1) {
				return res
					.status(404)
					.json({ status: false, message: 'Session not found' });
			}

			sessions[sessionIndex].lang = lang;
        	userJson.sessions = sessions;

			await updateSessionToken(userJson)

			return res
				.status(200)
				.json({ status: true, message: 'Language updated successfully' })
		} catch (e) {
			return next(e)
		}
	}
    async sendNotitifications(req, res, next) {
        try{
            const {empIds,messageId} = req.body;
        
            if (!empIds || !messageId) {
                return res
                    .status(409)
                    .json({ status: false, message: 'Token Or Message Id is invalid' })
            }

            for(const  empId of empIds){
                const sessions = userJson.sessions

                const session = sessions.find((item) => item.empID == empId)

				
				if(session.isWeb === true){
					return res
					.status(409)
					.json({ status: false, message: 'Cannot send notification for web user' })
				}

                if (!session || !session.token) {
                    return res
                        .status(404)
                        .json({ status: false, message: 'Session or Token not found' })
                }

                const message = messageJson.messages.find((item) => item.id == messageId)

                if (!message) {
                    return res
                        .status(404)
                        .json({ status: false, message: 'Message not found' })
                }

				let title = ''
				let body = ''
				const lang = session.lang; 
				if(lang === 'en'){
					title = message.content.en.header
					body = message.content.en.body
				} else if(lang === 'ru'){
					title = message.content.ru.header
					body = message.content.ru.body
				}else{
					title = message.content.uz.header
					body = message.content.uz.body
				}

                const notificationResponse = await sendNotification(session.token, title, body)

                if(!notificationResponse){
                    return res
                        .status(409)
                        .json({ status: notificationResponse.status, code: notificationResponse.code, message: notificationResponse.message })
                }
                
                return res
                    .status(200)
                    .json({ status: notificationResponse.status, code: notificationResponse.code, message: notificationResponse.message })
            }
        }catch(e){
            console.log('Error ' + e.message)
            return next(e)
        }
    }
}

module.exports = new b1Controller()
