const express = require('express');
const customController = require('./controllers/customController');
const { writeRoom, infoRoom, deleteRoom, updateRoom, infoNotification, updateNotification, infoUser, deleteNotification } = require('./helpers');
const app = express()
const httpServer = require('http').createServer(app)
const io = require('socket.io')(httpServer)

let socket;
io.on('connection', (socketIo) => {
    const rooms = io.sockets.adapter.rooms;
    const roomList = Array.from(rooms.keys());
    socket = socketIo
    socketIo.on('login', async ({ empId, wrh, job }) => {
        updateRoom({ empId, socket: socketIo.id, wrh, job })
    })
    socketIo.on('notactive', async ({ empId }) => {
        deleteRoom(empId)
    })
    module.exports = { socketIo }
})
module.exports = {
    io,
    express,
    httpServer,
    app,
    socket
}