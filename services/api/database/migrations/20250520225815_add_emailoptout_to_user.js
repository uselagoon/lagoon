/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('user', function(table) {
    // table.boolean('org_email_optin').notNullable().defaultTo(true);
    table.boolean('opt_email_org_role').notNullable().defaultTo(true); // when a users role within the organization management changes
    table.boolean('opt_email_sshkey').notNullable().defaultTo(true); // when an ssh key is added or removed from the user
    table.boolean('opt_email_group_role').notNullable().defaultTo(false); // when the users role within a group is changed. this should probably default to false because it could be quite noisy for some users
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('user', function(table) {
    // table.dropColumn('org_email_optin');
    table.dropColumn('opt_email_org_role');
    table.dropColumn('opt_email_sshkey');
    table.dropColumn('opt_email_group_role');
  });
};
