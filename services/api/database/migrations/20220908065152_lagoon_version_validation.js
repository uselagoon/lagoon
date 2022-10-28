/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function(knex) {
    lagoonVersion = await knex.schema.hasColumn('openshift', 'build_image');
    if (!lagoonVersion) {
        throw new Error("Exiting - build older than 2.10, please update to version 2.10")
    }
    else {
        return knex.schema
    }
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = function(knex) {
    return knex.schema
};
