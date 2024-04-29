const { count } = require('console')
const fs = require('fs')
const { get } = require('lodash')
const path = require('path')

function writeUser(userData) {
	const users = infoUser()
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		JSON.stringify([...users, userData], null, 4),
	)
}

function updateSessionToken(userData) {
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		JSON.stringify(userData, null, 4),
	)
}

function infoRoom() {
	let docs = fs.readFileSync(
		path.join(process.cwd(), 'database', 'room.json'),
		'UTF-8',
	)
	docs = docs ? JSON.parse(docs) : []
	return docs
}

function updateRoom(userData) {
	if (get(userData, 'empId') && get(userData, 'socket')) {
		let users = infoRoom()
		const index = users.findIndex((item) => item.empId === userData.empId)
		if (index != -1) {
			users[index] = { ...users[index], ...userData }
		} else {
			users = [...users, userData]
		}
		fs.writeFileSync(
			path.join(process.cwd(), 'database', 'room.json'),
			JSON.stringify(users, null, 4),
		)
	}
}

function deleteRoom(empId) {
	let users = infoRoom()
	users = users.filter((item) => item.empId != empId)
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'room.json'),
		JSON.stringify(users, null, 4),
	)
}
function updateNotification(uid, data) {
	const users = infoNotification()
	const index = users.findIndex((item) => item.uid == uid)
	users[index] = { ...users[index], ...data }
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'notification.json'),
		JSON.stringify(users, null, 4),
	)
}

function updateProduction(uid, data) {
	const users = infoProduction()
	const index = users.findIndex((item) => item.uid == uid)
	users[index] = { ...users[index], ...data }
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'productionOrder.json'),
		JSON.stringify(users, null, 4),
	)
}

function infoMessage() {
	let docs = fs.readFileSync(
		path.join(process.cwd(), 'database', 'message.json'),
		'UTF-8',
	)
	docs = docs ? JSON.parse(docs) : []
	return docs
}

function writeMessage(userData) {
	const users = infoMessage()
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'message.json'),
		JSON.stringify([...users, userData], null, 4),
	)
}
function infoPurchase() {
	let docs = fs.readFileSync(
		path.join(process.cwd(), 'database', 'purchase.json'),
		'UTF-8',
	)
	docs = docs ? JSON.parse(docs) : []
	return docs
}
function writePurchase(userData) {
	const users = infoPurchase()
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'purchase.json'),
		JSON.stringify([...users, userData], null, 4),
	)
	return userData
}

function infoProduction() {
	let docs = fs.readFileSync(
		path.join(process.cwd(), 'database', 'productionOrder.json'),
		'UTF-8',
	)
	docs = docs ? JSON.parse(docs) : []
	return docs
}
function writeProductionOrders(userData) {
	const users = infoProduction()
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'productionOrder.json'),
		JSON.stringify([...users, userData], null, 4),
	)
	return userData
}
function deleteProductionOrders(uid) {
	let users = infoProduction()
	users = users.filter((item) => item.uid != uid)
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'productionOrder.json'),
		JSON.stringify(users, null, 4),
	)
}

function deletePurchase(uid) {
	let users = infoPurchase()
	users = users.filter((item) => item.uid != uid)
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'purchase.json'),
		JSON.stringify(users, null, 4),
	)
}
function updatePurchase(uid, data) {
	const users = infoPurchase()
	const index = users.findIndex((item) => item.uid == uid)
	users[index] = { ...users[index], ...data }
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'purchase.json'),
		JSON.stringify(users, null, 4),
	)
}

function updatePurchaseTrue(arr = [], jobTitle) {
	if (arr.length) {
		const purchase = infoPurchase()
		const result = purchase.map((item) => {
			if (jobTitle == 'wrhmanager') {
				return {
					...item,
					empSeen: arr.includes(item.uid) ? true : item.empSeen,
				}
			}
			return {
				...item,
				qualitySeen: arr.includes(item.uid) ? true : item.qualitySeen,
			}
		})
		fs.writeFileSync(
			path.join(process.cwd(), 'database', 'purchase.json'),
			JSON.stringify(result, null, 4),
		)
	}
}
function updateProductionTrue(arr = [], jobTitle) {
	if (arr.length) {
		const purchase = infoProduction()
		const result = purchase.map((item) => {
			if (jobTitle == 'prodmanager') {
				return {
					...item,
					empSeen: arr.includes(item.uid) ? true : item.empSeen,
				}
			}
			return {
				...item,
				qualitySeen: arr.includes(item.uid) ? true : item.qualitySeen,
			}
		})
		fs.writeFileSync(
			path.join(process.cwd(), 'database', 'productionOrder.json'),
			JSON.stringify(result, null, 4),
		)
	}
}

function deleteMessage(uid) {
	let users = infoNotification()
	users = users.filter((item) => item.uid != uid)
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'message.json'),
		JSON.stringify(users, null, 4),
	)
}

function infoNotification() {
	let docs = fs.readFileSync(
		path.join(process.cwd(), 'database', 'notification.json'),
		'UTF-8',
	)
	docs = docs ? JSON.parse(docs) : []
	return docs
}

function writeNotification(userData) {
	const users = infoNotification()
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'notification.json'),
		JSON.stringify([...users, userData], null, 4),
	)
}

function deleteNotification(uid) {
	let users = infoNotification()
	users = users.filter((item) => item.uid != uid)
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'notification.json'),
		JSON.stringify(users, null, 4),
	)
}

function infoUser() {
	let docs = fs.readFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		'UTF-8',
	)
	docs = docs ? JSON.parse(docs) : []
	return docs
}

function updateUser(chat_id, userData) {
	const users = infoUser()

	const index = users.findIndex((item) => item.chat_id === chat_id)

	users[index] = { ...users[index], ...userData }
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		JSON.stringify(users, null, 4),
	)
}

function findSession(sessionId) {
	const db = infoUser()

	const session = db.sessions.find(({ SessionId }) => sessionId === SessionId)

	if (!session) {
		return null
	}

	if (
		new Date().valueOf() >
		session.startTime + session.SessionTimeout * 60 * 1000
	) {
		return null
	}

	return session
}

function findUserPermissions(empID) {
	const db = infoUser()

	const userRoleIds = db.userRoles
		.filter((e) => e.empID === empID)
		.map(({ roleId }) => roleId)
	const rolePermissions = db.rolePermissions.filter(({ roleId }) =>
		userRoleIds.includes(roleId),
	)
	// const rolePermissions = userRoles.map(({ roleId }) => db.rolePermissions
	//     .filter(({ roleId }) => roleId === roleId))
	const additionalPermissions = db.userAdditionalPermissions.filter(
		(e) => (e.empID = empID),
	)

	const permissions = formatPermissions([
		...rolePermissions,
		...additionalPermissions,
	])

	return permissions
}

function formatPermissions(permissions) {
	const acc = {}

	permissions.forEach((cur) => {
		acc[cur.objectId] = acc[cur.objectId] || []

		if (!acc[cur.objectId].includes(cur.action)) {
			acc[cur.objectId].push(cur.action)
		}
	})

	return acc
}

function getUPermissionsBySession(sessionId) {
	const session = findSession(sessionId)

	if (!session) {
		return null
	}

	return findUserPermissions(session.empID)
}

function saveSession(session) {
	const db = infoUser()

	const oldSessionI = db.sessions.findIndex(
		({ empID }) => empID === session.empID,
	)

	if (oldSessionI !== -1) {
		db.sessions[oldSessionI] = { ...db.sessions[oldSessionI], ...session }
	} else {
		db.sessions.push(session)
	}

	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		JSON.stringify(db, null, 4),
	)
}

function updateEmpWrh({ empID, wrh, jobTitle }) {
	const db = infoUser()

	const oldSessionI = db.sessions.findIndex((item) => item.empID === empID)

	if (oldSessionI !== -1) {
		db.sessions[oldSessionI] = {
			...db.sessions[oldSessionI],
			wrh,
			jobTitle
		}
	}
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		JSON.stringify(db, null, 4),
	)
}

function updateEmp(empID, data) {
	const db = infoUser()

	const oldSessionI = db.sessions.findIndex((item) => item.empID === empID)

	if (oldSessionI !== -1) {
		db.sessions[oldSessionI] = { ...db.sessions[oldSessionI], ...data }
	}
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		JSON.stringify(db, null, 4),
	)
}

module.exports = {
	writeUser,
	infoUser,
	updateUser,
	findSession,
	findUserPermissions,
	formatPermissions,
	getUPermissionsBySession,
	saveSession,
	// deleteSession,
	infoRoom,
	infoNotification,
	writeNotification,
	deleteRoom,
	updateRoom,
	updateNotification,
	updateNotification,
	updateEmpWrh,
	deleteNotification,
	infoMessage,
	writeMessage,
	deleteMessage,
	infoPurchase,
	writePurchase,
	deletePurchase,
	updatePurchaseTrue,
	updateEmp,
	updatePurchase,
	writeProductionOrders,
	infoProduction,
	deleteProductionOrders,
	updateProductionTrue,
	updateProduction,
	updateSessionToken,
}
