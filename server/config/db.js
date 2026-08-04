const mongoose = require('mongoose')

const connectDB = async () => {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/CommunityCollab'
  
  // Strip unsupported PostgreSQL 'sslmode' option if user accidentally included it in MongoDB URI
  if (uri.includes('sslmode=')) {
    console.warn('[DB Warning] Invalid parameter "sslmode" found in MONGO_URI. Removing "sslmode"...')
    uri = uri.replace(/([?&])sslmode=[^&]*(&|$)/, (match, p1, p2) => p2 === '&' ? p1 : '')
    uri = uri.replace(/\?$/, '')
  }

  try {
    const conn = await mongoose.connect(uri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    
    // Only attempt local fallback in non-production environments if MONGO_URI was provided
    if (process.env.NODE_ENV !== 'production' && process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1')) {
      console.log('Attempting local MongoDB fallback (development mode only)...')
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/CommunityCollab')
        console.log(`MongoDB Connected (Local Fallback): ${localConn.connection.host}`)
        return
      } catch (localErr) {
        console.error(`Local MongoDB fallback also failed: ${localErr.message}`)
      }
    }
    
    throw error
  }
}

module.exports = connectDB
