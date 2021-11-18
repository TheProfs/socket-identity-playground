'use strict'

if (!process.env.NODE_ENV) throw 'NODE_ENV is undefined.'
console.log(`NODE_ENV is set to: ${process.env.NODE_ENV}`)
const shouldUseSSL = process.env.NODE_ENV === 'development'

const path = require('path')
const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const cors = require('cors')

const app = express()
const httpServer = http.createServer(app)
const httpsServer = https.createServer({
  key: fs.readFileSync('ssl/dev/server.key', 'utf8'),
  cert: fs.readFileSync('ssl/dev/server.crt', 'utf8')
}, app)

app.set('port', (process.env.PORT || 5010))

app.get('/:room', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'))
})

const serverInstance = shouldUseSSL ? httpsServer : httpServer
const protocol = shouldUseSSL ? 'HTTPS' : 'HTTP'

serverInstance.listen(app.get('port'), () => {
  console.info(`${protocol} listening on: ${app.get('port')}`)
})
