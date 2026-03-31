// /**
//  * @param { import("knex").Knex } knex
//  * @returns { Promise<void> }
//  */
// exports.up = async function(knex) {
//     await knex.raw(
//         "ALTER TABLE deployment MODIFY COLUMN source_type ENUM('api', 'webhook', 'clone')"
//     );
// };

// /**
//  * @param { import("knex").Knex } knex
//  * @returns { Promise<void> }
//  */
// exports.down = async function(knex) {
//     await knex.raw(
//         "ALTER TABLE deployment MODIFY COLUMN source_type ENUM('api', 'webhook')"
//     );
// };

exports.up = async function(knex) {
};

exports.down = async function(knex) {
};