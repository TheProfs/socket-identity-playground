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
# Migrate & seed SQLite3 DB:
$ npm run reset-db-dev

# Run socket.io server as a 4 node cluster using PM2 and stream logs:
$ npm run stop-dev && npm run start-dev && pm2 logs --merge-logs

# Stop socket.io server (kill all nodes):
$ npm run stop-dev

# Reset database and restart cluster:
$ npm run reset-db-dev && npm run stop-dev && npm run start-dev && pm2 logs --merge-logs
```

then visit:

https://localhost:5009/ui/Maths?id_user=1

which will create a socket.io client as `id_user: '1'` and join room `"Maths"`
for example.

## Run on Heroku

This service is also running on [Heroku][heroku], available at: https://socket-identity-playground.herokuapp.com/

Pushing to `main` branch triggers a Heroku build.

### Heroku scripts

```bash
# Migrate/seed Heroku DB
$ heroku run npm run reset-db-staging -a socket-identity-playground
```

### Available users

You *must* use one of the following `id_user` when visiting a room:

| id_user | name      |
|---------|-----------|
| 1       | John      |
| 2       | Mary      |
| 3       | Mike      |
| 4       | Frank     |
| 5       | Stephanie |
| 6       | Richard   |
| 7       | Sonia     |
| 8       | Charlie   |
| 9       | Rowan     |
| 10      | Victoria  |

You can join any room you want.

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
  - Asks **all other nodes** if they have in their state a `socket` with
    that `id_socket`.
    If yes, the **other node** responds with the `socket.id_user` of the
    found `socket`.
- The **request node** responds to the `GET` request with a user list,
  each user containing a `id_socket` and an `id_user` like so:

```js
  // Room "Maths":
  [
    { id_socket: '70tSKzb9gzWwfL', id_user: 'foo' },
    { id_socket: '62sGlHCfUDdmAA', id_user: 'bar' }
  ]
```

![GET /:room/users architecture](https://i.ibb.co/YRgbPsT/Screenshot-2021-11-19-at-12-16-34-PM.png)

- The client is then responsible for hydrating the `id_user`s with the full
  user objects.
- When a client updates his identity info, he then broadcasts an
  `identity-change` event.
- Each participant in the room then rehydrates the user object for the `id_user`  
  that emitted the `identity-change`.

### Notes:

- We don't create additional state. Each node already has a state, the `io`
  object which keeps track of all connected `sockets` to that node.
  We simply add an additional property, `id_user` to each `socket`.
- Nodes do not actually directly communicate with each other.
  Communication between nodes happens using the [`customRequest` mechanism][socketio-custom-request],
  which uses [Redis Pub/Sub][redis-pubsub].

## Authors

The Profs

## License

The MIT License

[socket.io-multiple-nodes]: https://socket.io/docs/v3/using-multiple-nodes/
[redis]: https://redis.io/
[redis-pubsub]: https://redis.io/topics/pubsub
[socketio-custom-request]: https://github.com/socketio/socket.io-redis-adapter/tree/01028d03dbdc9cc05c940a2ac6bc367119165c16#redisadaptercustomrequestdataobject-fnfunction
[heroku]: https://heroku.com
