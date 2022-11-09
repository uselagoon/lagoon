// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
 module.exports = {

    client: 'mysql',
    connection: {
      host : process.env.API_DB_HOST || 'api-db',
      port : process.env.API_DB_PORT || 3306,
      user : process.env.API_DB_USER || 'api',
      password : process.env.API_DB_PASSWORD || 'api',
      database : process.env.API_DB_DATABASE || 'infrastructure'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    },

};
