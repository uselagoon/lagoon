/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function(knex) {
    DBExists = await knex.schema.hasTable('deployment');
        if (!DBExists) {
            return knex.schema
            .createTable('advanced_task_definition', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 300).notNullable();
                table.specificType('description', 'text').defaultTo('').notNullable();
                table.string('image', 2000).defaultTo('');
                table.string('service', 100);
                table.string('type', 100).notNullable();
                table.integer('environment');
                table.integer('project');
                table.string('group_name', 2000);
                table.enu('permission', ['GUEST', 'DEVELOPER', 'MAINTAINER']).defaultTo('GUEST');
                table.specificType('command', 'text').defaultTo('');
                table.string('confirmation_text', 2000); // Need to confirm if these rows are still required
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
                table.timestamp('deleted').notNullable().defaultTo('0000-00-00 00:00:00');
                table.unique(['name', 'environment', 'project', 'group_name'], {indexName: 'name', storageEngineIndexType: 'hash'});
            })
            .createTable('advanced_task_definition_argument', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('advanced_task_definition');
                table.string('name', 300).notNullable(); //TODO: this is currently unique in the existing setup - that's incorrect
                table.string('display_name', 500);
                table.enu('type', ['NUMERIC', 'STRING', 'ENVIRONMENT_SOURCE_NAME']);
                // table.enu('type', ['NUMERIC', 'STRING', 'ENVIRONMENT_SOURCE_NAME', 'ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF']); // Pending Lagoon 2.10
            })
            .createTable('backup_restore', function (table) {
                table.increments('id').notNullable().primary();
                table.string('backup_id', 300).unique({indexName:'backup_id'});
                table.enu('status', ['pending', 'successful', 'failed']).defaultTo('pending');
                table.string('restore_location', 300);
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('deploy_target_config', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('project');
                table.integer('weight').notNullable().defaultTo(0);
                table.string('branches', 300);
                table.string('pullrequests', 300);
                table.integer('deploy_target');
                table.string('deploy_target_project_pattern', 300);
            })
            .createTable('deployment', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).notNullable();
                table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete']).notNullable();
                table.datetime('created').notNullable().defaultTo(knex.fn.now());
                table.datetime('started');
                table.datetime('completed');
                table.integer('environment').notNullable();
                table.string('remote_id', 50);
                table.integer('priority'); // Need to confirm if these rows are still required
                table.string('bulk_id', 50); // Need to confirm if these rows are still required
                table.string('bulk_name', 100); // Need to confirm if these rows are still required
            })
            .createTable('env_vars', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 300).notNullable();
                table.text('value').notNullable();
                table.enu('scope',['global', 'build', 'runtime', 'container_registry', 'internal_container_registry']).notNullable().defaultTo('global');
                table.integer('project');
                table.integer('environment'); //TODO: note that the def in the existing schema is wrong
                table.unique(['name', 'project'], {indexName: 'name_project'});
                table.unique(['name', 'environment'], {indexName: 'name_environment'});
            })
            .createTable('environment', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100);
                table.integer('project');
                table.enu('deploy_type', ['branch', 'pullrequest', 'promote']).notNullable();
                table.string('deploy_base_ref', 100);
                table.string('deploy_head_ref', 100);
                table.string('deploy_title', 300);
                table.enu('environment_type', ['production', 'development']).notNullable();
                table.boolean('auto_idle').notNullable().defaultTo(1);
                table.string('openshift_project_name', 100);
                table.string('route', 300);
                table.text('routes');
                table.text('monitoring_urls');
                table.integer('openshift');
                table.string('openshift_project_pattern', 300);
                table.timestamp('updated').notNullable().defaultTo(knex.fn.now());
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
                table.timestamp('deleted').notNullable().defaultTo('0000-00-00 00:00:00'); //TODO: check what this does
                table.unique(['project', 'name', 'deleted'], {indexName: 'project_name_deleted'});
            })
            .createTable('environment_backup', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment');
                table.string('source', 300);
                table.string('backup_id', 300).unique({indexName:'backup_id'});
                table.timestamp('created').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
                table.timestamp('deleted').notNullable().defaultTo('0000-00-00 00:00:00'); //TODO: check what this does
            })
            .createTable('environment_fact', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment').defaultTo(null);
                table.string('service', 300);
                table.string('name', 300).notNullable();
                table.string('value', 300).notNullable();
                table.enu('type', ['TEXT', 'URL', 'SEMVER']).defaultTo('TEXT');
                table.string('source', 300).defaultTo('');
                table.specificType('description', 'text').defaultTo('');
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
                table.specificType('category', 'text').defaultTo('');
                table.boolean('key_fact').notNullable().defaultTo(0);
                table.unique(['environment', 'name', 'source'], {indexName: 'environment_fact'});
            })
            .createTable('environment_fact_reference', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('fid').notNullable();
                table.string('name', 300).notNullable();
                table.unique(['fid', 'name'], {indexName: 'fid'});
            })
            .createTable('environment_problem', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment');
                table.string('severity', 300).defaultTo('');
                table.decimal('severity_score', 1, 1).defaultTo(0);
                table.string('identifier', 300).notNullable();
                table.string('lagoon_service', 300).defaultTo('');
                table.string('source', 300).defaultTo('');
                table.string('associated_package', 300).defaultTo('');
                table.specificType('description', 'text').defaultTo('');
                table.string('version', 300).defaultTo('');
                table.string('fixed_version', 300).defaultTo('');
                table.string('links', 300).defaultTo('');
                table.json('data');
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
                table.timestamp('deleted').notNullable().defaultTo('0000-00-00 00:00:00');
                table.unique(['environment', 'lagoon_service', 'version', 'identifier', 'deleted'], {indexName: 'environment'});
            })
            .createTable('environment_service', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment').notNullable();
                table.string('name', 100).notNullable();
            })
            .createTable('environment_storage', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment');
                table.string('persistent_storage_claim', 100);
                table.bigInteger('bytes_used');
                table.date('updated');
                table.unique(['environment', 'persistent_storage_claim', 'updated'], {indexName: 'environment_persistent_storage_claim_updated'});
            })
            // .createTable('lagoon_version', function (table) {
            //     table.increments('id').notNullable().primary(); // Todo?
            //     table.integer('version').notNullable();
            // })
            .createTable('notification_email', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique({indexName: 'name'});
                table.string('email_address', 300);
            })
            .createTable('notification_microsoftteams', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique({indexName: 'name'});
                table.string('webhook', 512);
            })
            .createTable('notification_rocketchat', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique({indexName: 'name'});
                table.string('webhook', 300);
                table.string('channel', 300);
            })
            .createTable('notification_slack', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique({indexName: 'name'});
                table.string('webhook', 300);
                table.string('channel', 300);
            })
            .createTable('notification_webhook', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique({indexName: 'name'});
                table.string('webhook', 2000);
            })
            .createTable('openshift', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique({indexName: 'name'});
                table.string('console_url', 300);
                table.string('token', 2000);
                table.string('router_pattern', 300);
                table.string('ssh_host', 300);
                table.string('ssh_port', 50);
                table.string('monitoring_config', 2048);
                table.string('friendly_name', 100);
                table.string('cloud_provider', 100);
                table.string('cloud_region', 100);
                // table.string('build_image', 2000); // Pending Lagoon 2.10
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('problem_harbor_scan_matcher', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).notNullable();
                table.text('description');
                table.string('default_lagoon_project', 300);
                table.string('default_lagoon_environment', 300);
                table.string('default_lagoon_service_name', 300);
                table.string('regex', 300).notNullable();
            })
            .createTable('project', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).unique({indexName: 'name'});
                table.string('git_url', 300);
                table.string('availability', 50).defaultTo('STANDARD').notNullable();
                table.string('subfolder', 300);
                table.string('routerpattern', 300);
                table.string('active_systems_deploy', 300);
                table.string('active_systems_promote', 300);
                table.string('active_systems_remove', 300);
                table.string('active_systems_task', 300);
                table.string('active_systems_misc', 300);
                table.string('branches', 300);
                table.string('pullrequests', 300);
                table.string('production_environment', 100);
                table.text('production_routes');
                table.string('production_alias', 100).notNullable().defaultTo('lagoon-production')
                table.string('standby_production_environment', 100);
                table.text('standby_routes');
                table.string('standby_alias', 100).notNullable().defaultTo('lagoon-standby')
                table.boolean('auto_idle').notNullable().defaultTo(1);
                table.boolean('storage_calc').notNullable().defaultTo(1);
                table.boolean('problems_ui').notNullable().defaultTo(0);
                table.boolean('facts_ui').notNullable().defaultTo(0);
                table.boolean('deployments_disabled').notNullable().defaultTo(0);
                table.boolean('production_build_priority').notNullable().defaultTo(6);
                table.boolean('development_build_priority').notNullable().defaultTo(5);
                table.integer('openshift');
                table.string('openshift_project_pattern', 300);
                table.integer('development_environments_limit');
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
                table.string('private_key', 5000);
                table.json('metadata').defaultTo('{}');
                table.string('router_pattern', 300).defaultTo(null);
            })
            .createTable('project_notification', function (table) {
                table.integer('nid');
                table.integer('pid');
                table.enu('type', ['slack','rocketchat','microsoftteams','email', 'webhook']).notNullable();
                table.enu('content_type', ['deployment', 'problem']).notNullable();
                table.integer('notification_severity_threshold').notNullable().defaultTo(0);
                table.primary(['nid', 'pid', 'type']);
            })
            .createTable('s3_file', function (table) {
                table.increments('id').notNullable().primary();
                table.string('filename', 100).notNullable();
                table.text('s3_key').notNullable();
                table.datetime('created').notNullable().defaultTo(knex.fn.now());
                table.datetime('deleted').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('ssh_key', function (table) {
               table.increments('id').notNullable().primary();
               table.string('name', 100).notNullable();
               table.string('key_value', 5000).notNullable();
               table.enu('key_type', ['ssh-rsa', 'ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521']).notNullable().defaultTo('ssh-rsa');
               table.specificType('key_fingerprint', 'CHAR(51)').unique({indexName: 'key_fingerprint'});
               table.timestamp('created').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('task', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).notNullable();
                table.string('task_name', 100);
                table.integer('environment').notNullable();
                table.string('service', 100).notNullable();
                table.text('command').notNullable();
                table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'active', 'succeeded']).notNullable();
                table.datetime('created').notNullable().defaultTo(knex.fn.now());
                table.datetime('started');
                table.datetime('completed');
                table.string('remote_id', 50);
                table.enu('type', ['standard', 'advanced']).defaultTo('standard');
                table.string('advanced_image', 2000);
                table.text('advanced_payload');
            })
            .createTable('task_file', function (table) {
                table.integer('tid');
                table.integer('fid');
                table.primary(['tid', 'fid']);
            })
            .createTable('user_ssh_key', function (table) {
                table.specificType('usid', 'CHAR(36)');
                table.integer('skid');
                table.primary(['skid', 'usid']);
            })
            .createTable('workflow', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).notNullable();
                table.string('event', 300).notNullable();
                table.integer('project', 11).notNullable();
                table.integer('advanced_task_definition', 11).notNullable();
                table.timestamp('created').notNullable().defaultTo(knex.fn.now());
                table.timestamp('deleted').notNullable().defaultTo('0000-00-00 00:00:00');
            })
        }
        else {
            return knex.schema
        }

};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
    DBExists = await knex.schema.hasTable('deployment');
    if (DBExists) {
        return knex.schema
    }
};
