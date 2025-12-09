/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function(knex) {
    return knex.schema
    .alterTable('deployment', (table) => {
        table.enu('build_type',['build','variables']).notNullable().defaultTo('build');;
    })
    // set all existing deployments to build
    .raw("UPDATE deployment SET build_type='build'");
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
    // cant alter enums in place, so drop the column first :D
    return knex.schema
    .alterTable('deployment', (table) => {
        table.dropColumn('build_type');
    })
};
