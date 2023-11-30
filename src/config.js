const express = require('express');
const customController = require('./controllers/customController');
const { writeRoom, infoRoom, deleteRoom, updateRoom, infoNotification, updateNotification, infoUser, deleteNotification } = require('./helpers');
const app = express()
const httpServer = require('http').createServer(app)
const io = require('socket.io')(httpServer)


let socket;
io.on('connection', (socketIo) => {
    socket = socketIo
    socket.on('login', async ({ empId, wrh, job }) => {
        updateRoom({ empId, socket: socket.id, wrh, job })
    })
    socket.on('disconnect', async ({ empId }) => {
        deleteRoom(empId)
    })

    socket.on('confirmStockTransfer', async ({ job, uid }) => {
        let infoNot = infoNotification().find(item => item.uid == uid)
        if (infoNot) {
            updateNotification(uid, Object.fromEntries([[job, 2]]))
            let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
            let infoNotNew = infoNotification().find(item => item.uid == uid)
            if (roomId) {
                io.to(roomId.socket).emit('confirmedStockTransfer', { ...infoNotNew, confirmed: job, path: "inventoryTransfer", title: 'Перемещение запасов' })
            }
            if (infoNotNew.wrhmanager == 2 && infoNotNew.qualitycontroller == 2) {
                let session = infoUser().sessions.find((item) => item.empID === infoNotNew.fromEmpId)?.SessionId
                let data = await customController.stockTransferRequest(infoNotNew.body, session)
                if (roomId) {
                    io.to(roomId.socket).emit('statusStockTransfer', data?.status ? { status: true } : { status: false, message: errMessage })
                }
                if (data?.status) {
                    deleteNotification(infoNotNew.uid)
                }
            }
        }
    })


    socket.on('rejectStockTransfer', async ({ job, uid }) => {
        let infoNot = infoNotification().find(item => item.uid == uid)
        if (infoNot) {
            updateNotification(uid, Object.fromEntries([[job, 1]]))
            let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
            let infoNotNew = infoNotification().find(item => item.uid == uid)
            if (roomId) {
                io.to(roomId.socket).emit('notconfirmedStockTransfer', { ...infoNotNew, confirmed: job, path: "inventoryTransfer", title: 'Перемещение запасов' })
            }
        }
    })
})
module.exports = {
    io,
    express,
    httpServer,
    app,
    socket
}