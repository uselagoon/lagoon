/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  organizations = await knex.schema.hasTable('organization');
  if (!organizations) {
    return knex.schema
      .createTable('organization', (table) => {
        table.increments('id').notNullable().primary();
        table.string('name', 300).unique({ indexName: 'name' });
        table.string('friendly_name', 300).notNullable();
        table.specificType('description', 'text').notNullable();
        table.integer('quota_project').defaultTo(1).notNullable();
        table.integer('quota_group').defaultTo(10).notNullable();
        table.integer('quota_notification').defaultTo(10).notNullable();
        table.integer('quota_environment').defaultTo(5).notNullable();
        table.integer('quota_route').defaultTo(5).notNullable();
      })
      .createTable('organization_deploy_target', (table) => {
        table.integer('orgid');
        table.integer('dtid');
        table.primary(['orgid', 'dtid']);
      })
      .alterTable('notification_email', (table) => {
        table.integer('organization');
      })
      .alterTable('notification_microsoftteams', (table) => {
        table.integer('organization');
      })
      .alterTable('notification_rocketchat', (table) => {
        table.integer('organization');
      })
      .alterTable('notification_slack', (table) => {
        table.integer('organization');
      })
      .alterTable('notification_webhook', (table) => {
        table.integer('organization');
      })
      .alterTable('project', (table) => {
        table.integer('organization');
      });
  }

  return knex.schema;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema;
};
