# Database Migrations

Database migrations are now handled via Knex.js | A batteries-included, multi-dialect (PostgreSQL, MySQL, CockroachDB, MSSQL, SQLite3, Oracle (including Oracle Wallet Authentication)) query builder for
Node.js.

## Installation

The Knex migration CLI is bundled with the Knex install, and is driven by the node-liftoff module. To install globally, run:

`$ npm install knex -g`

The full Knex migration documentation can be found here - (https://knexjs.org/guide/migrations.html)

## Generating a migration file

To create a migration file navigate to /services/api/database and run:

`knex migrate:make migration_name`

**Try to make the migration names as descriptive as possible as they highlight to other users what exactly the migration is updating**

This will generate a migration file with a timestamp + the given migration name in the migrations folder, with empty up down functions.

## Creating a migration

`exports.up` specifies the updates to made to the database, `exports.down` aims to rollback the changes made in this specific migration e.g.

**Please ensure the down function is defined in each migration to allow for quick and simple rollbacks if required.**

### Creating/dropping a table
```javascript
exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('users', function (table) {
      table.increments(id).notNullable().primary();
      table.string('name').notNullable();
      table.string('email').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now())
      table.timestamp('updated_at').defaultTo(knex.fn.now())
    })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
}
```
### Creating/dropping a column
```javascript
exports.up = function(knex, Promise) {
  return knex.schema
    .alterTable('users', function (table) {
      table.dropColumn('name');
      table.string('first_name');
      table.string('last_name');
    })
}

exports.down = function(knex, Promise) {
  return knex.schema
    .alterTable('users', function (table) {
      table.string('name');
      table.dropColumn('first_name');
      table.dropColumn('last_name');
    })
}
```
**Aim to keep migrations as small as possible - this not only improves readability, but makes it easier to revert changes if a migration turns out to be malformed.**

For additional information please see the Knex documentation for Query building - (https://knexjs.org/guide/query-builder.html) & Schema building - (https://knexjs.org/guide/schema-builder.html)

### Run a migration

To perform the migration and update the database run:

`knex migrate:latest`

To rollback the last batch of migrations:

`knex migrate:rollback`

Additional flags and options are available - (https://knexjs.org/guide/migrations.html#migration-cli)
