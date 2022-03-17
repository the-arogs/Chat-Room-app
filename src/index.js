const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))



io.on('connection', (socket) => {
    console.log('New connection')

    // socket.emit('countUpdated', count) // socket.emit sends to a single client
 
    // socket.on('increment', () => {
    //     count++
    //     io.emit('countUpdated', count) // io.emit sends to all clients connected
    // })

   

    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage("Admin",'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('message', (chat, callback) => {
        const user  = getUser(socket.id)
        
        const filter = new Filter() 
        
        if (filter.isProfane(chat.chat)) {
            return callback('Be civil')
        }
        io.to(user.room).emit('message', generateMessage(user.username, chat.chat))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

        
    })

    socket.on('sendLocation', ({ lat, long }, callback) => {
        const user = getUser(socket.id)
       io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${lat},${long}`))
        callback('location shared')
    })
})


server.listen(port, () => {
    console.log('Listening on port ' + port)
})