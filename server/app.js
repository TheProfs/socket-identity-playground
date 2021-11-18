'use strict'

const procid = require('shortid')()

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

const getIdUserFromSocketId = id_socket => new Promise((resolve, reject) => {
  io.of('/').adapter.customRequest(id_socket, (err, replies) => {
    if (err)
      return reject(err)

    resolve(replies.find(el => !!el))
  })
})

app.get('/:room/users', async (req, res) => {
  io.of('/').adapter.clients([req.params.room], async (err, clients) => {
    if (err) {
      return res.status(500).send(err)
    }

    const users = []

    for (let id_socket of clients) {
      users.push({
        id_socket,
        id_user: await getIdUserFromSocketId(id_socket)
      })
    }

    res.json(users)
  })
})

io.of('/').adapter.customHook = (id_socket, cb) => {
  const socket = io.sockets.sockets[id_socket]

  cb(socket ? socket.data.id_user : null)
}

io.on('connection', socket => {
  console.log('Node:', procid, 'Socket:', socket.id, 'connection')

  const id_user = socket.handshake.query.id_user
  const room = socket.handshake.query.room

  socket.join(room)
  socket.data = { id_user }

  socket.on('paper-event', event => {
    console.log('Node:', procid, 'Socket:', socket.id, 'sent an event')
    socket.to(room).broadcast.emit('paper-event', {
      procid,
      ...event
    })
  })

  socket.on('disconnect', () => {
    console.log('Node:', procid, 'Socket:', socket.id, 'disconnection')
  })

  socket.emit('handshake', { procid })
})

const serverInstance = shouldUseSSL ? httpsServer : httpServer
const protocol = shouldUseSSL ? 'HTTPS' : 'HTTP'

serverInstance.listen(app.get('port'), () => {
  console.info(`${protocol} listening on: ${app.get('port')}`)
})
