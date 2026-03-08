require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host:     process.env.POSTGRES_HOST,
      port:     5432,
      database: process.env.POSTGRES_DB,
      user:     process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './src/config/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/config/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 20 },
    migrations: {
      directory: './src/config/migrations',
      tableName: 'knex_migrations',
    },
  },
};
