'use strict'

const Redis = require('socket.io-redis')
const config = require('../../redisfile.js')

if (!config[process.env.NODE_ENV]) {
  throw new Error(`Cannot find ${process.env.NODE_ENV} redis URL in redisfile.`)
}

// @NOTE
// Replace `:h` to prevent 'wrong auth parameters' error on Heroku.
// Might need to remove this if we update to Redis v6+
const redis = Redis(config[process.env.NODE_ENV].replace('h:', ''))
const conn = redis.pubClient.connection_options

console.log(`Using ${process.env.NODE_ENV} Redis on host: ${conn.host}`)

module.exports = redis
