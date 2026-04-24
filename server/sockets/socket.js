const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const Message = require('../models/Message')

let io

// roomUsers[room] = Set of { socketId, userId, name, avatar_url }
const roomUsers = {}

const initSocket = (server) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean)

  io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('No token provided'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      // Attach basic user info so we can broadcast it to rooms
      const User = require('../models/User')
      const user = await User.findById(decoded.id).select('name avatar_url')
      if (!user) return next(new Error('User not found'))
      socket.userName = user.name
      socket.userAvatar = user.avatar_url
      next()
    } catch (err) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.userName} (${socket.userId})`)

    // Auto-join personal notification room
    socket.join(`user:${socket.userId}`)
    socket.emit('connected', { userId: socket.userId, name: socket.userName })

    // Join a chat room (pool, event, skill_connection, dm)
    socket.on('join_room', ({ room }) => {
      socket.join(room)
      console.log(`[Socket] ${socket.userName} joined room: ${room}`)

      // Track online users in room
      if (!roomUsers[room]) roomUsers[room] = new Map()
      roomUsers[room].set(socket.id, {
        userId: socket.userId,
        name: socket.userName,
        avatar_url: socket.userAvatar
      })

      // Broadcast updated online users list to everyone in room
      io.to(room).emit('room_users', {
        room,
        users: Array.from(roomUsers[room].values())
      })
    })

    socket.on('leave_room', ({ room }) => {
      socket.leave(room)
      if (roomUsers[room]) {
        roomUsers[room].delete(socket.id)
        io.to(room).emit('room_users', {
          room,
          users: Array.from(roomUsers[room].values())
        })
        if (roomUsers[room].size === 0) delete roomUsers[room]
      }
    })

    // Send a message
    socket.on('send_message', async ({ room, content, type = 'text', card_data }) => {
      try {
        if (!room || !content?.trim()) {
          return socket.emit('message_error', { error: 'Room and content are required' })
        }
        const message = await Message.create({
          room,
          sender: socket.userId,
          content: content.trim(),
          type,
          card_data: card_data || null
        })
        const populated = await Message.findById(message._id)
          .populate('sender', 'name avatar_url verified')
        console.log(`[Socket] Message in ${room} from ${socket.userName}: ${content.substring(0, 40)}`)
        io.to(room).emit('new_message', populated)

        // DM notification for absent recipient
        if (room.startsWith('dm:')) {
          try {
            const parts = room.replace('dm:', '').split('_')
            const recipientId = parts[0] === socket.userId ? parts[1] : parts[0]
            const roomOccupants = roomUsers[room]
            const recipientActive = roomOccupants && [...roomOccupants.values()].some(u => u.userId === recipientId)
            if (!recipientActive) {
              const Notification = require('../models/Notification')
              const notif = await Notification.create({
                recipient: recipientId,
                type: 'message',
                title: `New message from ${socket.userName}`,
                message: content.trim().substring(0, 100),
                link: '/messages'
              })
              notifyUser(recipientId, 'notification:new', { notification: notif })
            }
          } catch (err) {
            console.error('[Socket] DM notification error:', err.message)
          }
        }
      } catch (err) {
        console.error('[Socket] send_message error:', err.message)
        socket.emit('message_error', { error: 'Failed to send message' })
      }
    })

    // Typing indicators
    socket.on('typing_start', ({ room }) => {
      socket.to(room).emit('user_typing', { userId: socket.userId, name: socket.userName })
    })
    socket.on('typing_stop', ({ room }) => {
      socket.to(room).emit('user_stopped_typing', { userId: socket.userId })
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.userName} (${socket.userId}) — reason: ${reason}`)
      // Clean up this socket from all rooms it was tracking
      for (const room of Object.keys(roomUsers)) {
        if (roomUsers[room]?.has(socket.id)) {
          roomUsers[room].delete(socket.id)
          io.to(room).emit('room_users', {
            room,
            users: Array.from(roomUsers[room].values())
          })
          if (roomUsers[room].size === 0) delete roomUsers[room]
        }
      }
    })
  })
}

const getIO = () => io

const notifyUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data)
    console.log(`[Socket] Notified user:${userId} -> ${event}`)
  }
}

module.exports = { initSocket, getIO, notifyUser }
