module.exports = {
  development: 'redis://127.0.0.1:6379',
  staging: process.env.REDIS_URL,
  production: process.env.REDIS_URL
}
