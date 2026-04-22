const jwt = require('jsonwebtoken')

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })

module.exports = { signToken }
