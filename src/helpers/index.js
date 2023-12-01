

const fs = require("fs");
const path = require("path");
function writeUser(userData) {
    let users = infoUser();
    fs.writeFileSync(
        path.join(process.cwd(), "database", "user.json"),
        JSON.stringify([...users, userData], null, 4)
    );
}

function infoRoom() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "database", "room.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : [];
    return docs;
}

function updateRoom(userData) {
    let users = infoRoom();
    let index = users.findIndex((item) => item.empId === userData.empId);
    if (index != -1) {
        users[index] = { ...users[index], ...userData };
    }
    else {
        users = [...users, userData]
    }
    fs.writeFileSync(
        path.join(process.cwd(), "database", "room.json"),
        JSON.stringify(users, null, 4)
    );
}

function deleteRoom(empId) {
    let users = infoRoom();
    users = users.filter(item => item.empId != empId)
    fs.writeFileSync(
        path.join(process.cwd(), "database", "room.json"),
        JSON.stringify(users, null, 4)
    );
}
function updateNotification(uid, data) {
    let users = infoNotification();
    let index = users.findIndex((item) => item.uid == uid);
    users[index] = { ...users[index], ...data };
    fs.writeFileSync(
        path.join(process.cwd(), "database", "notification.json"),
        JSON.stringify(users, null, 4)
    );
}

function infoMessage() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "database", "message.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : [];
    return docs;
}

function writeMessage(userData) {
    let users = infoNotification();
    fs.writeFileSync(
        path.join(process.cwd(), "database", "message.json"),
        JSON.stringify([...users, userData], null, 4)
    );
}


function deleteMessage(uid) {
    let users = infoNotification();
    users = users.filter(item => item.uid != uid)
    fs.writeFileSync(
        path.join(process.cwd(), "database", "message.json"),
        JSON.stringify(users, null, 4)
    );
}

function infoNotification() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "database", "notification.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : [];
    return docs;
}

function writeNotification(userData) {
    let users = infoNotification();
    fs.writeFileSync(
        path.join(process.cwd(), "database", "notification.json"),
        JSON.stringify([...users, userData], null, 4)
    );
}


function deleteNotification(uid) {
    let users = infoNotification();
    users = users.filter(item => item.uid != uid)
    fs.writeFileSync(
        path.join(process.cwd(), "database", "notification.json"),
        JSON.stringify(users, null, 4)
    );
}



function infoUser() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "database", "user.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : [];
    return docs;
}

function updateUser(chat_id, userData) {
    let users = infoUser();
    let index = users.findIndex((item) => item.chat_id === chat_id);
    users[index] = { ...users[index], ...userData };
    fs.writeFileSync(
        path.join(process.cwd(), "database", "user.json"),
        JSON.stringify(users, null, 4)
    );
}

function findSession(sessionId) {
    let db = infoUser()

    const session = db.sessions.find(({ SessionId }) => sessionId === SessionId)

    if (!session) {
        return null
    }

    if ((new Date()).valueOf() > session.startTime + session.SessionTimeout * 60 * 1000) {
        return null
    }

    return session
}

function findUserPermissions(empID) {
    let db = infoUser()

    const userRoleIds = db.userRoles.filter(e => e.empID === empID)
        .map(({ roleId }) => roleId)
    const rolePermissions = db.rolePermissions
        .filter(({ roleId }) => userRoleIds.includes(roleId))
    // const rolePermissions = userRoles.map(({ roleId }) => db.rolePermissions
    //     .filter(({ roleId }) => roleId === roleId))
    const additionalPermissions = db.userAdditionalPermissions
        .filter(e => e.empID = empID)

    const permissions = formatPermissions([...rolePermissions, ...additionalPermissions])

    return permissions
}

function formatPermissions(permissions) {
    let acc = {}

    permissions.forEach(cur => {
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
    let db = infoUser()

    const oldSessionI = db.sessions.findIndex(({ empID }) => empID === session.empID)

    if (oldSessionI !== -1) {
        db.sessions[oldSessionI] = { ...db.sessions[oldSessionI], ...session }
    } else {
        db.sessions.push(session)
    }

    fs.writeFileSync(path.join(process.cwd(), "database", "user.json"),
        JSON.stringify(db, null, 4));
}


function updateEmpWrh({ empID, wrh, jobTitle }) {
    let db = infoUser()

    const oldSessionI = db.sessions.findIndex((item) => item.empID === empID)

    if (oldSessionI !== -1) {
        db.sessions[oldSessionI] = { ...db.sessions[oldSessionI], wrh, jobTitle }
    }
    fs.writeFileSync(path.join(process.cwd(), "database", "user.json"),
        JSON.stringify(db, null, 4));
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
    deleteMessage
}