const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/CommunityCollab')
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Primary MongoDB connection failed (${error.message}). Trying local MongoDB...`)
    const localUri = 'mongodb://127.0.0.1:27017/CommunityCollab'
    const conn = await mongoose.connect(localUri)
    console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`)
  }
}

module.exports = connectDB
