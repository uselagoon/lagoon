/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex('environment')
    .leftJoin('project', 'environment.project', 'project.id')
    .whereNull('project.id')
    .andWhere('environment.deleted','0000-00-00 00:00:00')
    .update('deleted', knex.raw('NOW()'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
};
