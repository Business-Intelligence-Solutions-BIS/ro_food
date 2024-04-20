const Axios = require('axios')
const https = require('https')
const { get } = require('lodash')
const { io, socket, socketIo } = require('../config')
const { CREDENTIALS } = require('../credentials')
const {
	saveSession,
	writeRoom,
	writeTransferRequest,
	findSession,
	infoRoom,
	infoUser,
	writePurchase,
	infoPurchase,
	updatePurchase,
	updatePurchaseTrue,
	updateEmp,
	deletePurchase,
	infoProduction,
	updateProductionTrue,
	deleteProductionOrders,
	updateProduction,
	writeProductionOrders,
	updateUser,
	updateSessionToken,
} = require('../helpers')
const CustomController = require('./customController')
const Controller = require('./customController')
const ShortUniqueId = require('short-unique-id')
const customController = require('./customController')
const { GetItemStock } = require('./customController')
const { stat } = require('fs')
const { randomUUID } = new ShortUniqueId({ length: 10 })
const userJson = require('../../database/user.json')
const messageJson = require('../../database/message.json')
const {sendNotification} = require('../service/index')
const fs = require('fs')

class b1Controller {
	async test(req, res, next) {
		try {
			return res.status(201).json('Assalomu Aleykum')
		} catch (e) {
			return next(e)
		}
	}

	async login(req, res, next) {
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

			saveSession({
				...ret.data,
				empID: ret.userData.EmployeeID,
				startedAt: new Date().valueOf(),
			})

			res.set({
				...ret.headers,
			})
			return res.status(ret.status).send(ret.data)
		} catch (e) {
			return next(e)
		}
	}

	async login1(req, res, next) {
		const axios = require('axios')

		console.log('Bu yerga keldi')
		const config = {
			method: 'get',
			maxBodyLength: Number.POSITIVE_INFINITY,
			url: 'https://mannco.store/items/get?price=DESC&page=0&game=252490&skip=0',
			headers: {},
		}

		axios
			.request(config)
			.then((response) => {
				console.log(JSON.stringify(response.data))
			})
			.catch((error) => {
				console.log(error)
			})
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
	async ProductionOrderSocket(req, res, next) {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (sessionData) {
				const { status } = req.body // status true otk ga false wrh ga
				console.log(status, typeof status)
				const roomId = status
					? infoRoom().find((item) => item.job == 'qualitycontroller')?.socket
					: infoRoom().find((item) => item.wrh == get(req, 'body.wrh'))?.socket
				if (roomId) {
					console.log('ketdi ', roomId)
					io.to(roomId).emit('productionOrder', get(req, 'body.send', {}))
				}
				return res.status(200).send()
			} else {
				return res.status(401).send()
			}
		} catch (e) {
			return next(e)
		}
	}

	async PurchaseOrders(req, res, next) {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (sessionData) {
				const qualityEmpId = infoUser().sessions.find(
					(item) => item.jobTitle == 'qualitycontroller',
				)?.empID
				const uid = randomUUID()
				if (qualityEmpId) {
					const roomId = infoRoom().map(
						(item) => item.empId == qualityEmpId,
					).socket
					io.to(roomId).emit('notification', {
						qualitySeen: false,
						empSeen: false,
						createDate: new Date(),
						body: req.body,
						uid,
						fromEmpId: get(sessionData, 'empID'),
						qualityEmpId,
						qualitycontroller: 0,
						empId: qualityEmpId,
					})
				}
				if (qualityEmpId) {
					return res
						.status(201)
						.send(
							writePurchase({
								qualitySeen: false,
								empSeen: false,
								createDate: new Date(),
								body: req.body,
								uid,
								fromEmpId: get(sessionData, 'empID'),
								qualityEmpId,
								qualitycontroller: 0,
							}),
						)
				} else if (!qualityEmpId) {
					return res
						.status(404)
						.send({ status: false, message: 'Quality Controller not found' })
				}
			} else {
				return res.status(401).send()
			}
		} catch (e) {
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
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			const infoNot = infoPurchase().find((item) => item.uid == uid)

			if (sessionData) {
				const qualityEmpId = infoUser().sessions.find(
					(item) => item.jobTitle == 'qualitycontroller',
				)?.empID
				const uid = randomUUID()
				if (qualityEmpId) {
					const roomId = infoRoom().map(
						(item) => item.empId == qualityEmpId,
					).socket
					const data = io
						.to(roomId)
						.emit('notification', {
							qualitySeen: false,
							empSeen: false,
							createDate: new Date(),
							body: req.body,
							uid,
							fromEmpId: get(sessionData, 'empID'),
							qualityEmpId,
							qualitycontroller: 0,
							empId: qualityEmpId,
						})
				}
				if (qualityEmpId) {
					return res
						.status(201)
						.send(
							writeProductionOrders({
								qualitySeen: false,
								empSeen: false,
								createDate: new Date(),
								body: req.body,
								uid,
								fromEmpId: get(sessionData, 'empID'),
								qualityEmpId,
								qualitycontroller: 0,
							}),
						)
				} else if (!qualityEmpId) {
					return res
						.status(404)
						.send({ status: false, message: 'Quality Controller not found' })
				}
			} else {
				return res.status(401).send()
			}
		} catch (e) {
			return next(e)
		}
	}
	async PurchaseOrdersStatus(req, res, next) {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (sessionData) {
				const { status, job, uid, DocumentLines } = req.body
				const infoNot = infoPurchase().find((item) => item.uid == uid)
				if (infoNot) {
					if (infoNot[job] == 0) {
						if (status) {
							updatePurchase(uid, Object.fromEntries([[job, 2]]))
							const infoNotNew = infoPurchase().find((item) => item.uid == uid)
							const roomId = infoRoom().map(
								(item) => item.empId == infoNotNew.fromEmpId,
							).socket

							updatePurchase(uid, { body: { ...infoNot.body, DocumentLines } })
							if (roomId) {
								io.to(roomId).emit('confirmedPurchase', {
									...infoNotNew,
									empId: infoNotNew.fromEmpId,
									path: 'message',
									title: 'Поступление товаров',
								})
							}
							if (infoNotNew.qualitycontroller == 2) {
								deletePurchase(infoNotNew.uid)
							}
						} else {
							const roomId = infoRoom().map(
								(item) => item.empId == infoNot.fromEmpId,
							).socket

							updatePurchase(uid, Object.fromEntries([[job, 1]]))
							updatePurchase(uid, { body: { ...infoNot.body, DocumentLines } })
							const infoNotNew = infoPurchase().find((item) => item.uid == uid)
							if (roomId) {
								io.to(roomId).emit('notconfirmedPurchase', {
									...infoNotNew,
									empId: infoNot.fromEmpId,
									path: 'message',
									title: 'Поступление товаров',
								})
							}
							deletePurchase(infoNotNew.uid)
						}
						return res.status(200).send()
					} else {
						return res.status(403).send({ message: 'Tasdiqlay olmaysiz' })
					}
				} else {
					return res
						.status(404)
						.send({ status: false, message: 'uid Topilmadi' })
				}
			} else {
				return res.status(401).send()
			}
		} catch (e) {
			return next(e)
		}
	}
	async ProductionOrdersStatus(req, res, next) {
		try {
			const sessionId = req.cookies['B1SESSION']
			const sessionData = findSession(sessionId)
			if (sessionData) {
				const { status, job, uid } = req.body
				const infoNot = infoProduction().find((item) => item.uid == uid)
				if (infoNot) {
					if (infoNot[job] == 0) {
						if (status) {
							const roomId = infoRoom().map(
								(item) => item.empId == infoNot.fromEmpId,
							).socket

							updateProduction(uid, Object.fromEntries([[job, 2]]))
							updateProduction(uid, { body: { ...infoNot.body } })
							const infoNotNew = infoProduction().find(
								(item) => item.uid == uid,
							)
							if (roomId) {
								io.to(roomId).emit('confirmedProduction', {
									...infoNotNew,
									empId: infoNotNew.fromEmpId,
									path: 'message',
									title: 'Поступление товаров',
								})
							}
							if (infoNotNew.qualitycontroller == 2) {
								deleteProductionOrders(infoNotNew.uid)
							}
						} else {
							const room = infoRoom().map(
								(item) => item.empId == infoNot.fromEmpId,
							).socket
							updateProduction(uid, Object.fromEntries([[job, 1]]))
							updateProduction(uid, { body: { ...infoNot.body } })
							const infoNotNew = infoProduction().find(
								(item) => item.uid == uid,
							)
							if (room) {
								io.to(room).emit('notConfirmedProduction', {
									...infoNotNew,
									empId: infoNotNew.fromEmpId,
									path: 'message',
									title: 'Поступление товаров',
								})
							}
							deleteProductionOrders(infoNotNew.uid)
						}
						return res.status(200).send()
					} else {
						return res.status(403).send({ message: 'Tasdiqlay olmaysiz' })
					}
				} else {
					return res
						.status(404)
						.send({ status: false, message: 'uid Topilmadi' })
				}
			} else {
				return res.status(401).send()
			}
		} catch (e) {
			return next(e)
		}
	}
	async PurchaseOrdersGet(req, res, next) {
		try {
			delete req.headers.host
			delete req.headers['content-length']
			const sessionId = req.cookies['B1SESSION']
			const { skip = 0 } = req.query
			const sessionData = findSession(sessionId)
			if (sessionData) {
				let notification
				if (sessionData.jobTitle == 'wrhmanager') {
					notification = infoPurchase()
						.filter((item) => item?.fromEmpId == sessionData?.empID)
						.sort((a, b) => a.empSeen - b.empSeen)
				} else {
					notification = infoPurchase()
						.filter((item) => item?.qualityEmpId == sessionData?.empID)
						.sort((a, b) => a.qualitySeen - b.qualitySeen)
				}
				const actNotification = notification
				notification = notification.slice(skip, +skip + 20)
				if (notification.length) {
					const list =
						sessionData.jobTitle == 'wrhmanager'
							? notification
									.filter((item) => item.empSeen == false)
									.map((item) => item.uid)
							: notification
									.filter((item) => item.qualitySeen == false)
									.map((item) => item.uid)
					updatePurchaseTrue(list, sessionData.jobTitle)
					const len = notification.length
					const slLen = actNotification.slice(skip, +skip + 21).length
					notification = {
						data: notification,
						nextPage: len != slLen ? +skip + 20 : -1,
					}
				}

				return res.status(200).json(notification)
			} else {
				return res.status(401).send()
			}
		} catch (e) {
			return next(e)
		}
	}
	async ProductionOrdersGet(req, res, next) {
		try {
			delete req.headers.host
			delete req.headers['content-length']
			const sessionId = req.cookies['B1SESSION']
			const { skip = 0 } = req.query
			const sessionData = findSession(sessionId)
			if (sessionData) {
				let notification
				if (sessionData.jobTitle == 'prodmanager') {
					notification = infoProduction()
						.filter((item) => item?.fromEmpId == sessionData?.empID)
						.sort((a, b) => a.empSeen - b.empSeen)
				} else {
					notification = infoProduction()
						.filter((item) => item?.qualityEmpId == sessionData?.empID)
						.sort((a, b) => a.qualitySeen - b.qualitySeen)
				}

				const actNotification = notification
				notification = notification.slice(skip, +skip + 20)
				if (notification.length) {
					const list =
						sessionData.jobTitle == 'prodmanager'
							? notification
									.filter((item) => item.empSeen == false)
									.map((item) => item.uid)
							: notification
									.filter((item) => item.qualitySeen == false)
									.map((item) => item.uid)
					updateProductionTrue(list, sessionData.jobTitle)
					const len = notification.length
					const slLen = actNotification.slice(skip, +skip + 21).length
					notification = {
						data: notification,
						nextPage: len != slLen ? +skip + 20 : -1,
					}
				}
				return res.status(200).json(notification)
			} else {
				return res.status(401).send()
			}
		} catch (e) {
			return next(e)
		}
	}

	async ReturnItemStock(req, res, next) {
		try {
			const GetItem = await GetItemStock(req, res, next)
			if (GetItem.status) {
				return res.status(200).json(GetItem.data)
			} else {
				return res.status(404).json(GetItem.message)
			}
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

	async updateToken(req, res, next) {
		try {
			const { token, empId } = req.body

			if (!empId || !token) {
				return res
					.status(409)
					.json({ status: false, message: 'Token Or Employee Id is invalid' })
			}

			const sessions = userJson.sessions

			const session = sessions.find((item) => item.empID == empId)

			if (!session) {
				return res
					.status(404)
					.json({ status: false, message: 'Session not found' })
			}

			session.token = token

			userJson.sessions = sessions

			updateSessionToken(userJson)

			return res
				.status(200)
				.json({ status: true, message: 'Token saved successfully' })
		} catch (e) {
			console.log('Error ' + e.message)
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

                const notificationResponse = await sendNotification(session.token,message.content)

                if(!notificationResponse){
                    return res
                        .status(409)
                        .json({ status: false, message: 'Error in sending notification' })
                }
                
                return res
                    .status(200)
                    .json({ status: true, message: 'Notification sent successfully' })
            }
        }catch(e){
            console.log('Error ' + e.message)
            return next(e)
        }
    }
}

module.exports = new b1Controller()
