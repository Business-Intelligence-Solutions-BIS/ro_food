const fs = require('fs')
const path = require('path')

async function writeUser(userData) {
	const users = infoUser()
	fs.writeFileSync(
		path.join(process.cwd(), 'database', 'user.json'),
		JSON.stringify([...users, userData], null, 4),
	)
}

async function updateSessionToken(userData) {
	const filePath = path.join(process.cwd(), 'database', 'user.json');
	fs.writeFileSync(filePath, JSON.stringify(userData, null, 4));
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

async function saveSession(session) {
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

function infoUser() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "database", "user.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : [];
    return docs;
}

module.exports = {
	writeUser,
	infoUser,
	updateUser,
	findSession,
	saveSession,
	updateEmpWrh,
	updateEmp,
	updateSessionToken,
}
