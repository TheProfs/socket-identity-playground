module.exports = {
  development: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: './dev.sqlite3'
    }
  },

  staging: {
    client: 'pg',
    connection: {
      connectionString: `${process.env.DATABASE_URL}`,
      ssl: {
        rejectUnauthorized: false
      }
    },
    pool: {
      min: 1,
      max: 20
    }
  }
}
