# socket-identity-playground
Socket.io identity playground

## Install

```bash
$ npm install
```

## Run local

Ensure a REDIS instance is running on `redis://127.0.0.1:6379`, then:

```bash
# Run socket.io server
$ npm run start-dev

# Run UI server
$ npm run start-ui-dev
```

## Useful PM2 commands

```bash
# Run socket.io server as a 4 node cluster
NODE_ENV=development pm2 start server/app.js -i 4

# Stream logs from nodes
pm2 logs --merge-logs

# Stop the cluster
pm2 stop all && pm2 delete all  
```

## Authors

The Profs

## License

The MIT License
