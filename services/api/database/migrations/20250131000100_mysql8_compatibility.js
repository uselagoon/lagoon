/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema
    .alterTable('advanced_task_definition', (table) => {
      table.specificType('description', 'text').notNullable().alter();
      table.string('group_name', 300).alter();
      table.specificType('command', 'text').alter();
      table.timestamp('deleted').notNullable().alter();
    })
    .alterTable('environment', (table) => {
      table.timestamp('deleted').notNullable().alter();
      table.string('deploy_base_ref', 250).alter();
      table.string('deploy_head_ref', 250).alter();
    })
    .alterTable('environment_fact', (table) => {
      table.specificType('description', 'text').alter();
      table.specificType('category', 'text').alter();
    })
    .alterTable('environment_problem', (table) => {
      table.string('identifier', 100).notNullable().alter();
      table.string('lagoon_service', 100).defaultTo('').alter();
      table.specificType('description', 'text').alter();
      table.string('version', 100).defaultTo('').alter();
      table.timestamp('deleted').notNullable().alter();
    })
    .alterTable('organization', (table) => {
      table.specificType('description', 'text').notNullable().alter();
    })
    .alterTable('s3_file', (table) => {
      table.timestamp('created').notNullable().defaultTo(knex.fn.now()).alter();
      table.timestamp('deleted').notNullable().alter();
    })
    .alterTable('workflow', (table) => {
      table.timestamp('deleted').notNullable().alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // caveats around this are that the rollback can only work while data is still saved in keycloak attributes
  // once we remove that duplication of attribute into keycloak, this rollback would result in data loss for group>project associations
  // for any group project associations made after the attribute removal
  return knex.schema
    .alterTable('advanced_task_definition', (table) => {
      table.specificType('description', 'text').defaultTo('').notNullable().alter();
      table.string('group_name', 2000).alter();
      table.specificType('command', 'text').defaultTo('').alter();
    })
    .alterTable('environment', (table) => {
      table.string('deploy_base_ref', 100).alter();
      table.string('deploy_head_ref', 100).alter();
    })
    .alterTable('environment_fact', (table) => {
      table.specificType('description', 'text').defaultTo('').alter();
      table.specificType('category', 'text').defaultTo('').alter();
    })
    .alterTable('environment_problem', (table) => {
      table.string('identifier', 300).notNullable().alter();
      table.string('lagoon_service', 300).defaultTo('').alter();
      table.specificType('description', 'text').defaultTo('').alter();
      table.string('version', 300).defaultTo('').alter();
    })
    .alterTable('project', (table) => {
      table.json('metadata').defaultTo('{}').alter();
    })
    .alterTable('s3_file', (table) => {
      table.datetime('created').notNullable().defaultTo(knex.fn.now()).alter();
      table.datetime('deleted').notNullable().defaultTo('0000-00-00 00:00:00').alter();
    })
    .alterTable('organization', (table) => {
      table.specificType('description', 'text').notNullable().defaultTo('').alter();
    });
};
