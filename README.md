# socket-identity-playground
socket.io identity playground

## Install

```bash
# Install deps
$ npm install

# Install PM2, we need to run socket.io servers in cluster mode
$ npm install pm2@latest -g
```

## Run local

Ensure a REDIS instance is running on `redis://127.0.0.1:6379`, then:

```bash
# Run UI server
$ npm run start-ui-dev

# Run socket.io server as a 4 node cluster using PM2
$ npm run start-dev

# Stop socket.io server (kill all nodes):
$ npm run stop-dev
```

then visit:

https://localhost:5010/foo which will create a socket.io client
and join room `"foo"` for example.

## Authors

The Profs

## License

The MIT License
