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
            let infoNot = infoNotification().find(item => item.uid == uid)

            io.to(roomId.socket).emit('confirmedStockTransfer', { ...infoNot, confirmed: job })
            if (infoNot.wrhmanager == 2 && infoNot.qualitycontroller == 2) {
                let session = infoUser().sessions.find((item) => item.empID === infoNot.fromEmpId)?.SessionId
                let data = await customController.stockTransferRequest(infoNot.body, session)
                io.to(roomId.socket).emit(data?.status ? 'successStockTransfer' : 'conflictStockTransfer', data?.status ? { status: true } : { status: false, error: errMessage })
                if (data?.status) {
                    deleteNotification(infoNot.uid)
                }
            }
        }
    })


    socket.on('rejectStockTransfer', async ({ job, uid }) => {
        let infoNot = infoNotification().find(item => item.uid == uid)
        if (infoNot) {
            updateNotification(uid, Object.fromEntries([[job, 1]]))
            let roomId = infoRoom().find(item => item.empId == infoNot.fromEmpId)
            let infoNot = infoNotification().find(item => item.uid == uid)
            io.to(roomId.socket).emit('confirmedStockTransfer', { ...infoNot, notConfirmed: job })
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