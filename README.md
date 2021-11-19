# socket-identity-playground
socket.io identity playground

Experiment with ability to fetch room users with user IDs in
a [horizontally scalable, multi-node socket.io setup][socket.io-multiple-nodes]

## Install

```bash
# Install deps:
$ npm install

# Install PM2, we need to run socket.io servers in cluster mode:
$ npm install pm2@latest -g
```

## Run local

Ensure a [Redis][redis] instance is running on `redis://127.0.0.1:6379`, then:

```bash
# Run socket.io server as a 4 node cluster using PM2:
$ npm run start-dev

# .. and to stream logs:
$ pm2 logs --merge-logs

# Stop socket.io server (kill all nodes):
$ npm run stop-dev
```

then visit:

https://localhost:5009/Maths?id_user=foo which will create a socket.io client
with `id_user: 'foo'` and join room `"Maths"` for example.

## API Endpoints

Fetch a user list of users in room `"Maths"`

`GET`: `https://localhost:5009/Maths/users`

Example response:

```js
[
  { id_socket: 'aCfIOY5n5eEKQlOxAAAA', id_user: 'foo' },
  { id_socket: 'eKGcrPYDdHBEkdueAAAA', id_user: 'bar' }
]
```


## How it works

The client passes an `id_user` when connecting with a node.
The node, saves that value as a property of the socket, like so:

```js
// server
io.on('connection', socket => {
  socket.id_user = socket.handshake.query.id_user
})
```

The service exposes a REST endpoint, `GET: /:room/users`.
When pinged:

- `GET` request lands on a node, we'll call it the **request node**.
- The **request node** then finds out all the `socket ids` for that room.
- For each `id_socket`:
  - Asks the **other nodes** if they have in their state a `socket` with that
    `id_socket`.
    If yes, the **other node** response with the `socket.id_user` of the
    found `socket`.
- The **request node** responds to the `GET` request with a user list,
  each user containing a `id_socket` and an `id_user`

### Notes:

- We don't create additional state. Each node already has a state, the `io`
  object which keeps track of all connected `sockets` to that node.
  We simply add an additional property, `id_user` to each `socket`.
- Communication between nodes happens via the [`customRequest` mechanism][socketio-custom-request].

## Authors

The Profs

## License

The MIT License

[socket.io-multiple-nodes]: https://socket.io/docs/v3/using-multiple-nodes/
[redis]: https://redis.io/
[socketio-custom-request]: https://github.com/socketio/socket.io-redis-adapter/tree/01028d03dbdc9cc05c940a2ac6bc367119165c16#redisadaptercustomrequestdataobject-fnfunction
