'use strict'

if (!process.env.NODE_ENV) throw 'NODE_ENV is undefined.'
console.log(`NODE_ENV is set to: ${process.env.NODE_ENV}`)
const shouldUseSSL = process.env.NODE_ENV === 'development'

const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const cors = require('cors')
const socketIO = require('socket.io')
const redis = require('./redis')

const app = express()
const httpServer = http.createServer(app)
const httpsServer = https.createServer({
  key: fs.readFileSync('ssl/dev/server.key', 'utf8'),
  cert: fs.readFileSync('ssl/dev/server.crt', 'utf8')
}, app)
const io = socketIO(shouldUseSSL ? httpsServer : httpServer, {
  pingInterval: 10000,
  pingTimeout: 30000
})

app.use(cors({
  credentials: true,
  origin: [
    'https://localhost:5001'
  ]
}))

io.adapter(redis)
io.set('transports', ['websocket'])
app.set('port', (process.env.PORT || 5009))

io.on('connection', function(socket) {
  console.log('socket connected')

  socket.on('disconnect', function() {
    console.log('socket disconnected')
  })
})

const serverInstance = shouldUseSSL ? httpsServer : httpServer
const protocol = shouldUseSSL ? 'HTTPS' : 'HTTP'

serverInstance.listen(app.get('port'), () => {
  console.info(`${protocol} listening on: ${app.get('port')}`)
})
