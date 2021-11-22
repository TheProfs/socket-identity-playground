'use strict'

const procid = require('shortid')()

if (!process.env.NODE_ENV) throw 'NODE_ENV is undefined.'
console.log(`NODE_ENV is set to: ${process.env.NODE_ENV}`)
const shouldUseSSL = process.env.NODE_ENV === 'development'

const path = require('path')
const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const db = require('knex')(require('../knexfile.js')[process.env.NODE_ENV])
const cors = require('cors')
const bodyParser = require('body-parser')
const socketIO = require('socket.io')
const redis = require('./redis')

// General Setups

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

app.use(bodyParser.json({ limit: '1mb' }))
app.use(cors({
  credentials: true,
  origin: [
    'https://localhost:5010'
  ]
}))

io.adapter(redis)
io.set('transports', ['websocket'])
app.set('port', (process.env.PORT || 5009))

// UI serving routes

app.get('/ui/:room', async (req, res) => {
  try {
    res.sendFile(path.resolve(__dirname, '../ui/index.html'))
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.get('/', async (req, res) => {
  res.redirect(`/ui/foo?id_user=${Math.round(Math.random() * 10)}`)
})

// User Routes

app.get('/users', async (req, res) => {
  const users = await db('user').select('*')

  res.json(users)
})

app.get('/users/:id_user', async (req, res) => {
  const user = await db('user').first('*').where({
    id_user: req.params.id_user
  })

  if (!user)
    return res.status(404).send('Cannot find user with such id')

  res.json(user)
})

app.put('/users/:id_user', async (req, res) => {
  await db('user').update(req.body).where({
    id_user: req.params.id_user
  })

  res.sendStatus(204)
})

// Route: Get users in socket.io room

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
      console.error(err)

      return res.status(500).send(err)
    }

    const result = []

    // @REVIEW  Use throttled parallel promises here.
    for (let id_socket of clients) {
      const id_user = await getIdUserFromSocketId(id_socket)

      result.push({ id_user, id_socket, data: {} })
    }

    res.json(result)
  })
})

// socket.io node hook

io.of('/').adapter.customHook = (id_socket, cb) => {
  const socket = io.sockets.sockets[id_socket]

  cb(socket ? socket.data.id_user : null)
}

// socket.io setup

io.on('connection', socket => {
  console.log('Node:', procid, 'Socket:', socket.id, 'connection')

  const id_user = socket.handshake.query.id_user
  const room = socket.handshake.query.room

  socket.join(room)
  socket.data = { id_user }

  socket.on('identity-change', event => {
    socket.to(room).broadcast.emit('identity-change', event)
  })

  socket.on('disconnect', () => {
    console.log('Node:', procid, 'Socket:', socket.id, 'disconnection')
    socket.to(room).broadcast.emit('socket-disconnected', socket.id)
  })

  socket.emit('handshake', { procid })
  socket.to(room).broadcast.emit('socket-connected', socket.id)
})

const serverInstance = shouldUseSSL ? httpsServer : httpServer
const protocol = shouldUseSSL ? 'HTTPS' : 'HTTP'

serverInstance.listen(app.get('port'), () => {
  console.info(`${protocol} listening on: ${app.get('port')}`)
})
