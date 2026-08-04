const mongoose = require('mongoose')

const connectDB = async () => {
  let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/CommunityCollab'
  
  // Fix common query string mistake: sslmode is for PostgreSQL, MongoDB uses ssl=true or tls=true
  if (uri.includes('sslmode=')) {
    console.warn('[DB Warning] sslmode parameter found in MONGO_URI. Replacing sslmode with ssl=true...')
    uri = uri.replace(/sslmode=[^&]+/, 'ssl=true')
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
