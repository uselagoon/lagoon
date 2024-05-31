/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .raw(`ALTER TABLE organization ALTER quota_route SET DEFAULT -1;`)
  .raw(`ALTER TABLE organization ALTER quota_project SET DEFAULT -1;`)
  .raw(`ALTER TABLE organization ALTER quota_group SET DEFAULT -1;`)
  .raw(`ALTER TABLE organization ALTER quota_notification SET DEFAULT -1;`)
  .raw(`ALTER TABLE organization ALTER quota_environment SET DEFAULT -1;`)
  .alterTable('organization', function (table) {
    table.timestamp('created').defaultTo(knex.fn.now());
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
  .raw(`ALTER TABLE organization ALTER quota_route SET DEFAULT 5;`)
  .raw(`ALTER TABLE organization ALTER quota_project SET DEFAULT 1;`)
  .raw(`ALTER TABLE organization ALTER quota_group SET DEFAULT 10;`)
  .raw(`ALTER TABLE organization ALTER quota_notification SET DEFAULT 10;`)
  .raw(`ALTER TABLE organization ALTER quota_environment SET DEFAULT 5;`)
  .alterTable('organization', (table) => {
      table.dropColumn('created');
  })
};
