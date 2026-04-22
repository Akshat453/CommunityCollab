require('dotenv').config()
require('express-async-errors')
const express = require('express')
const cors = require('cors')
const http = require('http')
const connectDB = require('./config/db')
const { initSocket } = require('./sockets/socket')

const path = require('path')

const app = express()
const server = http.createServer(app)

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'))
app.use('/api/v1/users', require('./routes/user.routes'))
app.use('/api/v1/events', require('./routes/event.routes'))
app.use('/api/v1/pools', require('./routes/pool.routes'))
app.use('/api/v1/skills', require('./routes/skill.routes'))
app.use('/api/v1/resources', require('./routes/resource.routes'))
app.use('/api/v1/assistance', require('./routes/assistance.routes'))
app.use('/api/v1/chat', require('./routes/chat.routes'))
app.use('/api/v1/notifications', require('./routes/notification.routes'))
app.use('/api/v1/leaderboard', require('./routes/leaderboard.routes'))
app.use('/api/v1/map', require('./routes/map.routes'))

// Health check
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' })
})

// Start
const PORT = process.env.PORT || 5001
const start = async () => {
  await connectDB()
  initSocket(server)
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
start()

module.exports = app
