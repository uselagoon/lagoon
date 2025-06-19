/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('audit_log', function (table) {
    table
      .enu('resource_type', [
        'backup',
        'bulkdeployment',
        'deployment',
        'deploytarget',
        'deploytargetconfig',
        'environment',
        'group',
        'notification',
        'organization',
        'project',
        'sshkey',
        'task',
        'user',
        'variable',
        'workflow',
        'file',
      ])
      .alter();
    table
      .enu('linked_resource_type', [
        'backup',
        'bulkdeployment',
        'deployment',
        'deploytarget',
        'deploytargetconfig',
        'environment',
        'group',
        'notification',
        'organization',
        'project',
        'sshkey',
        'task',
        'user',
        'variable',
        'workflow',
        'file',
      ])
      .alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('audit_log', function (table) {
    table
      .enu('resource_type', [
        'backup',
        'bulkdeployment',
        'deployment',
        'deploytarget',
        'deploytargetconfig',
        'environment',
        'group',
        'notification',
        'organization',
        'project',
        'sshkey',
        'task',
        'user',
        'variable',
        'workflow',
      ])
      .alter();
    table
      .enu('linked_resource_type', [
        'backup',
        'bulkdeployment',
        'deployment',
        'deploytarget',
        'deploytargetconfig',
        'environment',
        'group',
        'notification',
        'organization',
        'project',
        'sshkey',
        'task',
        'user',
        'variable',
        'workflow',
      ])
      .alter();
  });
};
