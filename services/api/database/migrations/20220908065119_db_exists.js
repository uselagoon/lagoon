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
                table.string('name', 300).notNullable().unique();
                table.text('description').notNullable().defaultTo('');
                table.string('image', 2000).nullable().defaultTo('');
                table.string('service', 100);
                table.string('type', 100).notNullable();
                table.integer('environment').unique();
                table.integer('project').unique();
                table.string('group_name', 2000).nullable().unique();
                table.enu('permission', ['GUEST', 'DEVELOPER', 'MAINTAINER']).notNullable().defaultTo('GUEST');
                table.text('command').nullable().defaultTo('');
                table.text('confirmation_text', 2000).nullable(); // Need to confirm if these rows are still required
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('deleted').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('advanced_task_definition_argument', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('advanced_task_definition');
                table.string('name', 300).notNullable(); //TODO: this is currently unique in the existing setup - that's wrong
                table.string('display_name', 500);
                table.enu('type', ['NUMERIC', 'STRING', 'ENVIRONMENT_SOURCE_NAME']).notNullable();
            })
            .createTable('backup_restore', function (table) {
                table.increments('id').notNullable().primary();
                table.string('backup_id', 300).unique();
                table.enu('status', ['pending', 'successful', 'failed']).defaultTo('pending');
                table.string('restore_location', 300);
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
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
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('started').nullable();
                table.dateTime('completed').nullable();
                table.integer('environment').notNullable();
                table.string('remote_id', 50).nullable();
                table.integer('priority'); // Need to confirm if these rows are still required
                table.string('bulk_id', 50).nullable(); // Need to confirm if these rows are still required
                table.string('bulk_name', 50).nullable(); // Need to confirm if these rows are still required
            })
            .createTable('env_vars', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).notNullable().unique();
                table.text('value').notNullable();
                table.enu('scope',['global', 'build', 'runtime', 'container_registry', 'internal_container_registry']).notNullable().defaultTo('global');
                table.integer('project').nullable().unique();
                table.integer('environment').unique(); //TODO: note that the def in the existing schema is wrong
            })
            .createTable('environment', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).unique();
                table.integer('project').unique();
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
                table.dateTime('updated').notNullable().defaultTo(knex.fn.now());
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('deleted').notNullable().unique().defaultTo(knex.fn.now()); //TODO: check what this does
            })
            .createTable('environment_backup', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment');
                table.string('source', 300);
                table.string('backup_id', 300).unique();
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('deleted').notNullable().defaultTo(knex.fn.now()); //TODO: check what this does
            })
            .createTable('environment_fact', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment').unique();
                table.string('name', 300).notNullable().unique();
                table.string('value', 300).notNullable();
                table.enu('type', ['TEXT', 'URL', 'SEMVER']).notNullable().defaultTo('TEXT');
                table.string('source', 300).nullable().unique().defaultTo('');
                table.text('description').nullable().defaultTo('');
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.text('category').nullable().defaultTo('');
                table.boolean('key_fact').notNullable().defaultTo(0);
            })
            .createTable('environment_fact_reference', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('fid').nullable().unique();
                table.string('name', 300).notNullable().unique();
            })
            .createTable('environment_problem', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment').unique();
                table.string('severity', 300).nullable().defaultTo('');
                table.decimal('severity_score', 1, 1).defaultTo(0);
                table.string('identifier', 300).notNullable().unique().defaultTo('');
                table.string('lagoon_service', 300).nullable().unique().defaultTo('');
                table.string('source', 300).nullable().defaultTo('');
                table.string('associated_package', 300).nullable().defaultTo('');
                table.text('description').defaultTo('');
                table.string('version', 300).nullable().unique().defaultTo('');
                table.string('fixed_version', 300).nullable().defaultTo('');
                table.string('links', 300).nullable().defaultTo('');
                table.json('data');
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('deleted').notNullable().unique().defaultTo(knex.fn.now());
            })
            .createTable('environment_service', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment');
                table.string('name', 100).notNullable();
            })
            .createTable('environment_storage', function (table) {
                table.increments('id').notNullable().primary();
                table.integer('environment').unique();
                table.string('persistent_storage_claim', 100).unique();
                table.bigInteger('bytes_used');
                table.date('updated').unique();
            })
            // .createTable('lagoon_version', function (table) {
            //     table.increments('id').notNullable().primary();
            //     table.integer('version').notNullable();
            // })
            .createTable('notification_email', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique();
                table.string('email_address', 300);
            })
            .createTable('notification_microsoftteams', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique();
                table.string('webhook', 512);
            })
            .createTable('notification_rocketchat', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique();
                table.string('webhook', 300);
                table.string('channel', 300);
            })
            .createTable('notification_slack', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique();
                table.string('webhook', 300);
                table.string('channel', 300);
            })
            .createTable('notification_webhook', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique();
                table.string('webhook', 2000);
            })
            .createTable('openshift', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).unique();
                table.string('console_url', 300);
                table.string('token', 2000);
                table.string('router_pattern', 300);
                table.string('project_user', 100); // Confirm if this is required
                table.string('ssh_host', 300);
                table.string('ssh_port', 50);
                table.string('friendly_name', 100);
                table.string('cloud_provider', 100);
                table.string('cloud_region', 100);
                table.string('build_image', 2000);
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('problem_harbor_scan_matcher', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).notNullable();
                table.text('description');
                table.string('default_lagoon_project', 300).nullable();
                table.string('default_lagoon_environment', 300).nullable();
                table.string('default_lagoon_service_name', 300).nullable();
                table.string('regex', 300).notNullable();
            })
            .createTable('project', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).unique();
                table.string('git_url', 300);
                table.string('availability').defaultTo('STANDARD').notNullable();
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
                table.integer('development_environments_limit').nullable();
                table.string('private_key', 5000);
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('project_notification', function (table) {
                table.integer('nid');
                table.integer('pid').nullable();
                table.enu('type', ['slack','rocketchat','microsoftteams','email', 'webhook']).notNullable();
                table.enu('content_type', ['deployment', 'problem']).notNullable();
                table.integer('notification_severity_threshold').notNullable().defaultTo(0);
                table.primary(['nid', 'pid', 'type']);
            })
            .createTable('s3_file', function (table) {
                table.increments('id').notNullable().primary();
                table.string('filename', 100).notNullable();
                table.text('s3_key').notNullable();
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('deleted').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('ssh_key', function (table) {
               table.increments('id').notNullable().primary();
               table.string('name', 100).notNullable();
               table.string('key_value', 5000).notNullable();
               table.enu('key_type', ['ssh-rsa', 'ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521']).notNullable().defaultTo('ssh-rsa');
               table.specificType('key_fingerprint', 'CHAR(51)').nullable().unique();
               table.dateTime('created').notNullable().defaultTo(knex.fn.now());
            })
            .createTable('task', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 100).notNullable();
                table.string('task_name', 100).nullable();
                table.integer('environment');
                table.string('service', 100).notNullable();
                table.string('command', 300).notNullable();
                table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'active', 'succeeded']).notNullable();
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('started').nullable();
                table.dateTime('completed').nullable();
                table.string('remote_id', 50).nullable();
                table.enu('type', ['standard', 'advanced']).notNullable().defaultTo('standard');
                table.string('advanced_image', 2000).nullable();
                table.text('advanced_payload');
            })
            .createTable('task_file', function (table) {
                table.integer('tid').nullable();
                table.integer('fid').nullable();
                table.primary(['tid', 'fid']);
            })
            .createTable('user_ssh_key', function (table) {
                table.integer('cid').nullable();
                table.integer('usid').nullable();
                table.primary(['cid', 'usid']);
            })
            .createTable('workflow', function (table) {
                table.increments('id').notNullable().primary();
                table.string('name', 50).notNullable();
                table.string('event', 300).notNullable();
                table.integer('project', 11).notNullable();
                table.integer('advanced_task_definition', 11).notNullable();
                table.dateTime('created').notNullable().defaultTo(knex.fn.now());
                table.dateTime('deleted').notNullable().defaultTo(knex.fn.now());
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
            .dropTableIfExists("advanced_task_definition")
            .dropTableIfExists("advanced_task_definition_argument")
            .dropTableIfExists("backup_restore")
            .dropTableIfExists("deploy_target_config")
            .dropTableIfExists("deployment")
            .dropTableIfExists("env_vars")
            .dropTableIfExists("environment")
            .dropTableIfExists("environment_backup")
            .dropTableIfExists("environment_fact")
            .dropTableIfExists("environment_fact_reference")
            .dropTableIfExists("environment_problem")
            .dropTableIfExists("environment_service")
            .dropTableIfExists("environment_storage")
            .dropTableIfExists("notification_email")
            .dropTableIfExists("notification_microsoftteams")
            .dropTableIfExists("notification_rocketchat")
            .dropTableIfExists("notification_slack")
            .dropTableIfExists("notification_webhook")
            .dropTableIfExists("openshift")
            .dropTableIfExists("problem_harbor_scan_matcher")
            .dropTableIfExists("project")
            .dropTableIfExists("project_notification")
            .dropTableIfExists("s3_file")
            .dropTableIfExists("ssh_key")
            .dropTableIfExists("task")
            .dropTableIfExists("task_file")
            .dropTableIfExists("user_ssh_key")
            .dropTableIfExists("workflow")
    }
    else {
        return knex.schema
    }
};
