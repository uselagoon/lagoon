exports.up = function(knex) {
    // fix the way the enum values are stored to be lowercase for mysql strict
    return Promise.all([
        knex('deployment')
            .where('source_type', '=', 'API')
            .update('source_type', 'api'),
        knex('deployment')
            .where('source_type', '=', 'WEBHOOK')
            .update('source_type', 'webhook'),
        knex('task')
            .where('source_type', '=', 'API')
            .update('source_type', 'api'),
    ]);
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
return knex.schema;
};