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

    console.log(roomList, ' bu roomlist')
    socket = socketIo
    socketIo.on('login', async ({ empId, wrh, job }) => {
        updateRoom({ empId, socket: socketIo.id, wrh, job })
    })
    socketIo.on('notactive', async ({ empId }) => {
        deleteRoom(empId)
    })

    // socketIo.on('disconnect', () => {
    //     console.log('Foydalanuvchi chiqdi: ' + socketIo.id);

    //     const roomID = connectedUsers[socketIo.id];

    //     if (roomID) {
    //       console.log('Room ID o\'chirildi: ' + roomID);
    //       delete connectedUsers[socketIo.id];
    //     }
    //   });

    module.exports = { socketIo }
})
module.exports = {
    io,
    express,
    httpServer,
    app,
    socket
}