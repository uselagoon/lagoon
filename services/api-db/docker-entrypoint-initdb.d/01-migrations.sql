USE infrastructure;

-- Migrations

DELIMITER $$

CREATE OR REPLACE PROCEDURE
  CreateProject
  (
    IN id                              int,
    IN name                            varchar(100),
    IN git_url                         varchar(300),
    IN availability                      varchar(50),
    IN private_key                     varchar(5000),
    IN subfolder                       varchar(300),
    IN router_pattern                  varchar(300),
    IN openshift                       int,
    IN openshift_project_pattern       varchar(300),
    IN active_systems_deploy           varchar(300),
    IN active_systems_promote          varchar(300),
    IN active_systems_remove           varchar(300),
    IN active_systems_task             varchar(300),
    IN active_systems_misc             varchar(300),
    IN branches                        varchar(300),
    IN pullrequests                    varchar(300),
    IN production_environment          varchar(100),
    IN production_routes               text,
    IN production_alias                varchar(100),
    IN standby_production_environment  varchar(100),
    IN standby_routes                  text,
    IN standby_alias                   varchar(100),
    IN auto_idle                       int(1),
    IN storage_calc                    int(1),
    IN problems_ui                     int(1),
    IN facts_ui                        int(1),
    IN production_build_priority       int,
    IN development_build_priority      int,
    IN development_environments_limit  int
  )
  BEGIN
    DECLARE new_pid int;
    DECLARE v_oid int;


    SELECT o.id INTO v_oid FROM openshift o WHERE o.id = openshift;


    IF (v_oid IS NULL) THEN
      SET @message_text = concat('Openshift ID: "', openshift, '" does not exist');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;


    IF (id IS NULL) THEN
      SET id = 0;
    END IF;


    INSERT INTO project (
        id,
        name,
        git_url,
        availability,
        private_key,
        subfolder,
        router_pattern,
        active_systems_deploy,
        active_systems_promote,
        active_systems_remove,
        active_systems_task,
        active_systems_misc,
        branches,
        production_environment,
        production_routes,
        production_alias,
        standby_production_environment,
        standby_routes,
        standby_alias,
        auto_idle,
        storage_calc,
        problems_ui,
        facts_ui,
        production_build_priority,
        development_build_priority,
        pullrequests,
        openshift,
        openshift_project_pattern,
        development_environments_limit
    )
    SELECT
        id,
        name,
        git_url,
        availability,
        private_key,
        subfolder,
        router_pattern,
        active_systems_deploy,
        active_systems_promote,
        active_systems_remove,
        active_systems_task,
        active_systems_misc,
        branches,
        production_environment,
        production_routes,
        production_alias,
        standby_production_environment,
        standby_routes,
        standby_alias,
        auto_idle,
        storage_calc,
        problems_ui,
        facts_ui,
        production_build_priority,
        development_build_priority,
        pullrequests,
        os.id,
        openshift_project_pattern,
        development_environments_limit
    FROM
        openshift AS os
    WHERE
        os.id = openshift;


    -- id = 0 explicitly tells auto-increment field
    -- to auto-generate a value
    IF (id = 0) THEN
      SET new_pid = LAST_INSERT_ID();
    ELSE
      SET new_pid = id;
    END IF;


    -- Return the constructed project
    SELECT
      p.*
    FROM project p
    WHERE p.id = new_pid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_availability_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'availability'
    ) THEN
      ALTER TABLE `project`
      ADD `availability` varchar(50);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_production_environment_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'production_environment'
    ) THEN
      ALTER TABLE `project`
      ADD `production_environment` varchar(100);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_production_routes_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'production_routes'
    ) THEN
      ALTER TABLE `project`
      ADD `production_routes` text;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_standby_production_environment_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'standby_production_environment'
    ) THEN
      ALTER TABLE `project`
      ADD `standby_production_environment` varchar(100);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_standby_routes_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'standby_routes'
    ) THEN
      ALTER TABLE `project`
      ADD `standby_routes` text;
    END IF;
  END;
$$


CREATE OR REPLACE PROCEDURE
  add_production_alias_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'production_alias'
    ) THEN
      ALTER TABLE `project`
      ADD `production_alias` varchar(100) NOT NULL DEFAULT 'lagoon-production';
    END IF;
  END;
$$


CREATE OR REPLACE PROCEDURE
  add_standby_alias_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'standby_alias'
    ) THEN
      ALTER TABLE `project`
      ADD `standby_alias` varchar(100) NOT NULL DEFAULT 'lagoon-standby';
    END IF;
  END;
$$
CREATE OR REPLACE PROCEDURE
  add_ssh_to_openshift()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'ssh_host'
    ) THEN
      ALTER TABLE `openshift`
      ADD `ssh_host` varchar(300);
      ALTER TABLE `openshift`
      ADD `ssh_port` varchar(50);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_project_pullrequest_to_varchar()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project'
      AND table_schema = 'infrastructure'
      AND column_name = 'pullrequests';

    IF (column_type = 'tinyint') THEN
      ALTER TABLE project
      MODIFY pullrequests varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_active_systems_promote_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'active_systems_promote'
    ) THEN
      ALTER TABLE `project`
      ADD `active_systems_promote` varchar(300);
      UPDATE project
      SET active_systems_promote = 'lagoon_controllerBuildDeploy';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_git_type_to_deploy_type_in_environment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'deploy_type'
    ) THEN
      ALTER TABLE `environment`
      CHANGE `git_type` `deploy_type` ENUM('branch','pullrequest');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_promote_to_deploy_type_in_environment()

  BEGIN
    DECLARE column_type_enum_deploy_type varchar(50);

    SELECT COLUMN_TYPE INTO column_type_enum_deploy_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'environment'
      AND table_schema = 'infrastructure'
      AND column_name = 'deploy_type';

    IF (
      column_type_enum_deploy_type = "enum('branch','pullrequest')"
    ) THEN
      ALTER TABLE environment
      MODIFY deploy_type ENUM('branch','pullrequest','promote');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_autoidle_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'auto_idle'
    ) THEN
      ALTER TABLE `project`
      ADD `auto_idle` int(1) NOT NULL default '1';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_rocketchat_to_type_in_project_notification()

  BEGIN
    DECLARE column_type_project_notification_type varchar(74);

    SELECT COLUMN_TYPE INTO column_type_project_notification_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project_notification'
      AND table_schema = 'infrastructure'
      AND column_name = 'type';

    IF (
      column_type_project_notification_type = "enum('slack')"
    ) THEN
      ALTER TABLE project_notification
      MODIFY type ENUM('slack','rocketchat');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deleted_to_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'deleted'
    ) THEN
      ALTER TABLE `environment`
      DROP INDEX project_name;
      ALTER TABLE `environment`
      ADD `deleted` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00';
      ALTER TABLE `environment`
      ADD UNIQUE KEY `project_name_deleted` (`project`,`name`, `deleted`);
    END IF;
  END;
$$


CREATE OR REPLACE PROCEDURE
  add_storagecalc_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'storage_calc'
    ) THEN
      ALTER TABLE `project`
      ADD `storage_calc` int(1) NOT NULL default '1';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_project_pattern_to_openshift()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'project_pattern'
    ) THEN
      ALTER TABLE `openshift`
      ADD `project_pattern` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_subfolder_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'subfolder'
    ) THEN
      ALTER TABLE `project`
      ADD `subfolder` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  delete_project_pattern_from_openshift()

  BEGIN
    IF EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'project_pattern'
    ) THEN
      ALTER TABLE `openshift`
      DROP COLUMN `project_pattern`;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_openshift_project_pattern_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'openshift_project_pattern'
    ) THEN
      ALTER TABLE `project`
      ADD `openshift_project_pattern` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_keyValue_to_key_value_in_ssh_key()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'ssh_key'
        AND table_schema = 'infrastructure'
        AND column_name = 'key_value'
    ) THEN
      ALTER TABLE `ssh_key`
      CHANGE `keyValue` `key_value` varchar(5000) NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_keyType_to_key_type_in_ssh_key()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'ssh_key'
        AND table_schema = 'infrastructure'
        AND column_name = 'key_type'
    ) THEN
      ALTER TABLE `ssh_key`
      CHANGE `keyType` `key_type` ENUM('ssh-rsa', 'ssh-ed25519') NOT NULL DEFAULT 'ssh-rsa';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  -- Rename environment.openshift_projectname to environment_openshift_project_name
  rename_openshift_projectname_in_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'openshift_project_name'
    ) THEN
      ALTER TABLE `environment`
      CHANGE `openshift_projectname` `openshift_project_name` varchar(100);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_routes_monitoring_urls_to_environments()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'route'
    ) THEN
      ALTER TABLE `environment` ADD `route` varchar(300);
      ALTER TABLE `environment` ADD `routes` text;
      ALTER TABLE `environment` ADD `monitoring_urls` text;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_environment_limit_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'development_environments_limit'
    ) THEN
      ALTER TABLE `project` ADD `development_environments_limit` int;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_legacy_pid_skid_view()

  BEGIN
    DROP VIEW IF EXISTS pid_skid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_legacy_customer_ssh_key_junction_table()

  BEGIN
    DROP TABLE IF EXISTS customer_ssh_key;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_legacy_project_ssh_key_junction_table()

  BEGIN
    DROP TABLE IF EXISTS project_ssh_key;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_active_systems_task_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'active_systems_task'
    ) THEN
      ALTER TABLE `project`
      ADD `active_systems_task` varchar(300);
      UPDATE project
      SET active_systems_task = 'lagoon_openshiftJob';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_active_systems_misc_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'active_systems_misc'
    ) THEN
      ALTER TABLE `project`
      ADD `active_systems_misc` varchar(300);
      UPDATE project
      SET active_systems_misc = 'lagoon_openshiftMisc';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_default_value_to_task_status()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'task'
        AND table_schema = 'infrastructure'
        AND column_name = 'status'
    ) THEN
      ALTER TABLE `task`
      ALTER COLUMN `status`
      SET DEFAULT 'active';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_scope_to_env_vars()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'env_vars'
        AND table_schema = 'infrastructure'
        AND column_name = 'scope'
    ) THEN
      ALTER TABLE `env_vars`
      ADD `scope` ENUM('global', 'build', 'runtime') NOT NULL DEFAULT 'global';
      UPDATE env_vars
      SET scope = 'global';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deleted_to_environment_backup()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_backup'
        AND table_schema = 'infrastructure'
        AND column_name = 'deleted'
    ) THEN
      ALTER TABLE `environment_backup`
      ADD `deleted` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00';
      UPDATE environment_backup
      SET deleted = '0000-00-00 00:00:00';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_task_command_to_text()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'task'
      AND table_schema = 'infrastructure'
      AND column_name = 'command';

    IF (column_type = 'varchar') THEN
      ALTER TABLE task
      MODIFY command text NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_key_fingerprint_to_ssh_key()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'ssh_key'
        AND table_schema = 'infrastructure'
        AND column_name = 'key_fingerprint'
    ) THEN
      ALTER TABLE `ssh_key`
      ADD `key_fingerprint` char(51) NULL UNIQUE;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_autoidle_to_environment()


  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'auto_idle'
    ) THEN
      ALTER TABLE `environment`
      ADD `auto_idle` int(1) NOT NULL default '1';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deploy_base_head_ref_title_to_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'deploy_base_ref'
    ) THEN
      ALTER TABLE `environment`
      ADD `deploy_base_ref` varchar(100),
      ADD `deploy_head_ref` varchar(100),
      ADD `deploy_title` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_env_vars_from_varchar_to_text()

  BEGIN
    DECLARE column_type varchar(300);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'env_vars'
      AND table_schema = 'infrastructure'
      AND column_name = 'value';

    IF (column_type = 'varchar') THEN
      ALTER TABLE `env_vars`
      MODIFY `value` text NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_user_ssh_key_usid_to_char()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'user_ssh_key'
      AND table_schema = 'infrastructure'
      AND column_name = 'usid';

    IF (column_type = 'int') THEN
      ALTER TABLE user_ssh_key
      MODIFY usid char(36) NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_private_key_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'private_key'
    ) THEN
      ALTER TABLE `project`
      ADD `private_key` varchar(5000);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_index_for_environment_backup_environment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE
        table_name = 'environment_backup'
        AND table_schema = 'infrastructure'
        AND index_name='backup_environment'
    ) THEN
      ALTER TABLE `environment_backup`
      ADD INDEX `backup_environment` (`environment`);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_email_microsoftteams_to_type_in_project_notification()

  BEGIN
    DECLARE column_type_project_notification_type varchar(74);

    SELECT COLUMN_TYPE INTO column_type_project_notification_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project_notification'
      AND table_schema = 'infrastructure'
      AND column_name = 'type';

    IF (
      column_type_project_notification_type = "enum('slack','rocketchat')"
    ) THEN
      ALTER TABLE project_notification
      MODIFY type ENUM('slack','rocketchat','microsoftteams','email');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_container_registry_scope_to_env_vars()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'env_vars'
        AND table_schema = 'infrastructure'
        AND column_name = 'scope'
        AND column_type like '%''container_registry%'
    ) THEN
      ALTER TABLE `env_vars`
      MODIFY scope ENUM('global', 'build', 'runtime', 'container_registry') NOT NULL DEFAULT 'global';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_internal_container_registry_scope_to_env_vars()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'env_vars'
        AND table_schema = 'infrastructure'
        AND column_name = 'scope'
        AND column_type like '%''internal_container_registry%'
    ) THEN
      ALTER TABLE `env_vars`
      MODIFY scope ENUM('global', 'build', 'runtime', 'container_registry', 'internal_container_registry') NOT NULL DEFAULT 'global';
    END IF;
  END;
$$


CREATE OR REPLACE PROCEDURE
  update_openshift_varchar_length()

  BEGIN
    ALTER TABLE openshift
    MODIFY token varchar(2000);
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_monitoring_config_to_openshift()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'monitoring_config'
    ) THEN
      ALTER TABLE `openshift`
      ADD `monitoring_config` varchar(2048);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_additional_harbor_scan_fields_to_environment_problem()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_problem'
        AND table_schema = 'infrastructure'
        AND column_name = 'associated_package'
    ) THEN
      ALTER TABLE `environment_problem`
      ADD `associated_package` varchar(300) DEFAULT '',
      ADD `description` TEXT NULL DEFAULT '',
      ADD `version` varchar(300) DEFAULT '',
      ADD `fixed_version` varchar(300) DEFAULT '',
      ADD `links` varchar(300) DEFAULT '';
      ALTER TABLE `environment_problem`
      DROP INDEX environment;
      ALTER TABLE `environment_problem`
      ADD UNIQUE KEY `environment` (`environment`, `lagoon_service`, `version`, `identifier`, `deleted`);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_problems_ui_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'problems_ui'
    ) THEN
      ALTER TABLE `project`
      ADD `problems_ui` int(1) NOT NULL default '0';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_facts_ui_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'facts_ui'
    ) THEN
      ALTER TABLE `project`
      ADD `facts_ui` int(1) NOT NULL default '0';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_fact_source_and_description_to_environment_fact()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_fact'
        AND table_schema = 'infrastructure'
        AND column_name = 'source'
    ) THEN
        ALTER TABLE `environment_fact`
        ADD `source` varchar(300) NOT NULL default '';
        ALTER TABLE `environment_fact`
        ADD `description` TEXT NULL DEFAULT '';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_fact_category_to_environment_fact()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_fact'
        AND table_schema = 'infrastructure'
        AND column_name = 'category'
    ) THEN
        ALTER TABLE `environment_fact`
        ADD `category` TEXT NULL DEFAULT '';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_fact_key_to_environment_fact()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_fact'
        AND table_schema = 'infrastructure'
        AND column_name = 'key_fact'
    ) THEN
        ALTER TABLE `environment_fact`
        ADD `key_fact` TINYINT(1) NOT NULL DEFAULT(0);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  update_unique_environment_fact()

  BEGIN
    IF EXISTS(
      SELECT null FROM INFORMATION_SCHEMA.STATISTICS WHERE
      TABLE_NAME = 'environment_fact' and INDEX_NAME = 'environment'
    ) THEN
        ALTER TABLE `environment_fact`
        DROP INDEX `environment`;
        ALTER TABLE `environment_fact` ADD CONSTRAINT environment_fact_unique UNIQUE(environment, name, source);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_service_to_environment_fact()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_fact'
        AND table_schema = 'infrastructure'
        AND column_name = 'service'
    ) THEN
        ALTER TABLE `environment_fact`
        ADD `service` varchar(300) NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  update_user_password()

  BEGIN
    SET PASSWORD FOR '$MARIADB_USER'@'%' = PASSWORD('$MARIADB_PASSWORD');
    FLUSH PRIVILEGES;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_metadata_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'metadata'
    ) THEN
      ALTER TABLE project
      ADD metadata JSON DEFAULT '{}' CHECK (JSON_VALID(metadata));
      UPDATE project
      SET metadata = '{}';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_content_type_to_project_notification()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project_notification'
        AND table_schema = 'infrastructure'
        AND column_name = 'content_type'
    ) THEN
      ALTER TABLE `project_notification`
      ADD `content_type` ENUM('deployment', 'problem') NOT NULL DEFAULT 'deployment',
      ADD `notification_severity_threshold` int NOT NULL default 0;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_project_production_routes_to_text()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project'
      AND table_schema = 'infrastructure'
      AND column_name = 'production_routes';

    IF (column_type = 'varchar') THEN
      ALTER TABLE project
      MODIFY production_routes text;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_project_standby_routes_to_text()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project'
      AND table_schema = 'infrastructure'
      AND column_name = 'standby_routes';

    IF (column_type = 'varchar') THEN
      ALTER TABLE project
      MODIFY standby_routes text;
    END IF;
  END;
$$


CREATE OR REPLACE PROCEDURE
  add_advanced_task_details_to_task_table()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'task'
        AND table_schema = 'infrastructure'
        AND column_name = 'type'
    ) THEN
      ALTER TABLE `task`
      ADD `type` ENUM('standard', 'advanced') default 'standard',
      ADD `advanced_image` varchar(2000),
      ADD advanced_payload text;
    END IF;
  END;

$$

CREATE OR REPLACE PROCEDURE
  add_fact_type_to_environment_fact()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_fact'
        AND table_schema = 'infrastructure'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE `environment_fact`
        ADD `type` ENUM('TEXT', 'URL') NOT NULL DEFAULT 'TEXT';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_webhook_to_type_in_project_notification()

  BEGIN
    DECLARE column_type_project_notification_type varchar(74);

    SELECT COLUMN_TYPE INTO column_type_project_notification_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project_notification'
      AND table_schema = 'infrastructure'
      AND column_name = 'type';

    IF (
      column_type_project_notification_type = "enum('slack','rocketchat','microsoftteams','email')"
    ) THEN
      ALTER TABLE project_notification
      MODIFY type ENUM('slack','rocketchat','microsoftteams','email', 'webhook');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_index_for_deployment_environment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE
        table_name = 'deployment'
        AND table_schema = 'infrastructure'
        AND index_name='deployment_environment'
    ) THEN
      ALTER TABLE `deployment`
      ADD INDEX `deployment_environment` (`environment`);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_index_for_task_environment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE
        table_name = 'task'
        AND table_schema = 'infrastructure'
        AND index_name='task_environment'
    ) THEN
      ALTER TABLE `task`
      ADD INDEX `task_environment` (`environment`);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_router_pattern_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'router_pattern'
    ) THEN
      ALTER TABLE `project`
      ADD `router_pattern` varchar(300);
    END IF;
  END;
$$


CREATE OR REPLACE PROCEDURE
  add_environment_type_to_advanced_task_argument()

  BEGIN
    DECLARE column_type_argument_type varchar(74);

    SELECT COLUMN_TYPE INTO column_type_argument_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'advanced_task_definition_argument'
      AND table_schema = 'infrastructure'
      AND column_name = 'type';

    IF (
      column_type_argument_type = "enum('NUMERIC','STRING')"
    ) THEN
      ALTER TABLE advanced_task_definition_argument
      MODIFY type ENUM('NUMERIC', 'STRING', 'ENVIRONMENT_SOURCE_NAME');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  change_name_index_for_advanced_task_argument()
  BEGIN
    IF EXISTS(
      SELECT null FROM INFORMATION_SCHEMA.STATISTICS WHERE
      TABLE_NAME = 'advanced_task_definition_argument' and INDEX_NAME = 'name'
    ) THEN
        ALTER TABLE `advanced_task_definition_argument`
        DROP INDEX `name`;
        ALTER TABLE `advanced_task_definition_argument` ADD CONSTRAINT advanced_task_definition_argument_unique UNIQUE(advanced_task_definition, name);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_openshift_to_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'openshift'
    ) THEN
      ALTER TABLE `environment`
      ADD `openshift` int;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_openshift_project_pattern_to_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'openshift_project_pattern'
    ) THEN
      ALTER TABLE `environment`
      ADD `openshift_project_pattern` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deployments_disabled_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'deployments_disabled'
    ) THEN
      ALTER TABLE `project`
      ADD `deployments_disabled` int(1) NOT NULL default '0';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  migrate_project_openshift_to_environment()

  BEGIN
    UPDATE environment e
    LEFT JOIN project p ON
      e.project = p.id
    SET
      e.openshift = p.openshift,
      e.openshift_project_pattern = p.openshift_project_pattern
    WHERE
      e.openshift IS NULL;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_billing_data()

  BEGIN
    DROP TABLE IF EXISTS billing_modifier;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_metadata_to_openshift()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'friendly_name'
    ) THEN
      ALTER TABLE `openshift`
      ADD `friendly_name`       varchar(100),
      ADD `cloud_provider`      varchar(100),
      ADD `cloud_region`        varchar(100);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_production_build_priority_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'production_build_priority'
    ) THEN
      ALTER TABLE `project`
      ADD `production_build_priority` int NOT NULL default '6';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_development_build_priority_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'development_build_priority'
    ) THEN
      ALTER TABLE `project`
      ADD `development_build_priority` int NOT NULL default '6';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_priority_to_deployment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'deployment'
        AND table_schema = 'infrastructure'
        AND column_name = 'priority'
    ) THEN
      ALTER TABLE `deployment`
      ADD `priority` int NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_bulk_id_to_deployment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'deployment'
        AND table_schema = 'infrastructure'
        AND column_name = 'bulk_id'
    ) THEN
      ALTER TABLE `deployment`
      ADD `bulk_id` varchar(50) NULL,
      ADD `bulk_name` varchar(100) NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_legacy_permissions()

  BEGIN
    DROP VIEW IF EXISTS pid_usid;
    DROP VIEW IF EXISTS permission;

    DROP TABLE IF EXISTS customer;
    DROP TABLE IF EXISTS user;
    DROP TABLE IF EXISTS customer_user;
    DROP TABLE IF EXISTS project_user;

    IF EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'project_user'
    ) THEN
      ALTER TABLE `openshift`
      DROP COLUMN `project_user`;
    END IF;

    IF EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'customer'
    ) THEN
      ALTER TABLE `project`
      DROP COLUMN `customer`;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_confirmation_text_to_advanced_task_def()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'advanced_task_definition'
        AND column_name = 'confirmation_text'
    ) THEN
      ALTER TABLE `advanced_task_definition`
      ADD `confirmation_text` varchar(2000) NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_display_name_to_advanced_task_argument()
  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'advanced_task_definition_argument'
        AND column_name = 'display_name'
    ) THEN
      ALTER TABLE `advanced_task_definition_argument`
      ADD `display_name` varchar(500) NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_ecdsa_ssh_key_types()

  BEGIN
    DECLARE column_type_argument_type varchar(100);

    SELECT COLUMN_TYPE INTO column_type_argument_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'ssh_key'
      AND table_schema = 'infrastructure'
      AND column_name = 'key_type';

    IF (
      column_type_argument_type = "enum('ssh-rsa','ssh-ed25519')"
    ) THEN
      ALTER TABLE ssh_key
      MODIFY key_type ENUM('ssh-rsa', 'ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521') NOT NULL DEFAULT 'ssh-rsa';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_task_name_to_tasks()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'task'
        AND table_schema = 'infrastructure'
        AND column_name = 'task_name'
    ) THEN
      ALTER TABLE `task`
      ADD `task_name` varchar(100) NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_new_task_status_types()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'task'
        AND table_schema = 'infrastructure'
        AND column_name = 'status'
        AND column_type like '%''cancelled%'
    ) THEN
      ALTER TABLE `task`
      MODIFY status ENUM('new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'active', 'succeeded') NOT NULL;
    END IF;
  END;
$$

-- update any active or succeeded statuses to be running or complete
CREATE OR REPLACE PROCEDURE
  update_active_succeeded_tasks()

  BEGIN
    UPDATE task t
    SET
      t.status = 'running'
    WHERE
      t.task_name = 'active';
    UPDATE task t
    SET
      t.status = 'complete'
    WHERE
      t.task_name = 'succeeded';
  END;
$$

-- generate a taskname for tasks missing one
CREATE OR REPLACE PROCEDURE
  update_missing_tasknames()

  BEGIN
    UPDATE task t
    SET
      t.task_name = CONCAT('lagoon-task-', (SELECT LEFT(UUID(), 6)))
    WHERE
      t.task_name IS NULL;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_no_ui_and_admin_task_to_advanced_task_def()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'advanced_task_definition'
        AND table_schema = 'infrastructure'
        AND column_name = 'show_ui'
    ) THEN
      ALTER TABLE `advanced_task_definition`
      ADD  `show_ui`    int(1) NOT NULL default 1,
      ADD  `admin_task` int(1) NOT NULL default 0;
    END IF;
  END;
$$

-- TODO: Eventually the `active/succeeded` values should go away once `remote-controller` is updated to send the correct values
-- CREATE OR REPLACE PROCEDURE
--   remove_active_succeeded_task_types()

--   BEGIN
--     IF NOT EXISTS (
--       SELECT NULL
--       FROM INFORMATION_SCHEMA.COLUMNS
--       WHERE
--         table_name = 'task'
--         AND table_schema = 'infrastructure'
--         AND column_name = 'status'
--         AND column_type like '%''cancelled%'
--     ) THEN
--       ALTER TABLE `task`
--       MODIFY status ENUM('new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete') NOT NULL;
--     END IF;
--   END;
-- $$

DELIMITER ;

-- If adding new procedures, add them to the bottom of this list
CALL add_availability_to_project();
CALL add_production_environment_to_project();
CALL add_ssh_to_openshift();
CALL convert_project_pullrequest_to_varchar();
CALL add_active_systems_promote_to_project();
CALL rename_git_type_to_deploy_type_in_environment();
CALL add_enum_promote_to_deploy_type_in_environment();
CALL add_autoidle_to_project();
CALL add_enum_rocketchat_to_type_in_project_notification();
CALL add_deleted_to_environment;
CALL add_storagecalc_to_project();
CALL add_project_pattern_to_openshift();
CALL add_subfolder_to_project();
CALL delete_project_pattern_from_openshift();
CALL add_openshift_project_pattern_to_project();
CALL rename_keyValue_to_key_value_in_ssh_key();
CALL rename_keyType_to_key_type_in_ssh_key();
CALL rename_openshift_projectname_in_environment();
CALL add_routes_monitoring_urls_to_environments();
CALL add_environment_limit_to_project();
CALL drop_legacy_pid_skid_view();
CALL drop_legacy_customer_ssh_key_junction_table();
CALL drop_legacy_project_ssh_key_junction_table();
CALL add_active_systems_task_to_project();
CALL add_default_value_to_task_status();
CALL add_scope_to_env_vars();
CALL add_deleted_to_environment_backup();
CALL convert_task_command_to_text();
CALL add_key_fingerprint_to_ssh_key();
CALL add_autoidle_to_environment();
CALL add_deploy_base_head_ref_title_to_environment();
CALL convert_env_vars_from_varchar_to_text();
CALL convert_user_ssh_key_usid_to_char();
CALL add_private_key_to_project();
CALL add_index_for_environment_backup_environment();
CALL add_enum_email_microsoftteams_to_type_in_project_notification();
CALL add_monitoring_config_to_openshift();
CALL add_standby_production_environment_to_project();
CALL add_standby_routes_to_project();
CALL add_production_routes_to_project();
CALL add_standby_alias_to_project();
CALL add_production_alias_to_project();
CALL add_active_systems_misc_to_project();
CALL add_container_registry_scope_to_env_vars();
CALL add_internal_container_registry_scope_to_env_vars();
CALL add_additional_harbor_scan_fields_to_environment_problem();
CALL update_user_password();
CALL add_problems_ui_to_project();
CALL add_facts_ui_to_project();
CALL add_fact_source_and_description_to_environment_fact();
CALL add_fact_type_to_environment_fact();
CALL add_fact_category_to_environment_fact();
CALL add_fact_key_to_environment_fact();
CALL update_unique_environment_fact();
CALL add_service_to_environment_fact();
CALL add_metadata_to_project();
CALL add_content_type_to_project_notification();
CALL convert_project_production_routes_to_text();
CALL convert_project_standby_routes_to_text();
CALL add_advanced_task_details_to_task_table();
CALL add_enum_webhook_to_type_in_project_notification();
CALL add_index_for_deployment_environment();
CALL add_index_for_task_environment();
CALL add_router_pattern_to_project();
CALL add_environment_type_to_advanced_task_argument();
CALL add_openshift_to_environment();
CALL add_openshift_project_pattern_to_environment();
CALL add_deployments_disabled_to_project();
CALL update_openshift_varchar_length();
CALL migrate_project_openshift_to_environment();
CALL drop_billing_data();
CALL add_metadata_to_openshift();
CALL add_production_build_priority_to_project();
CALL add_development_build_priority_to_project();
CALL add_priority_to_deployment();
CALL add_bulk_id_to_deployment();
CALL drop_legacy_permissions();
CALL change_name_index_for_advanced_task_argument();
CALL add_confirmation_text_to_advanced_task_def();
CALL add_display_name_to_advanced_task_argument();
CALL add_ecdsa_ssh_key_types();
CALL add_task_name_to_tasks();
CALL add_new_task_status_types();
CALL update_active_succeeded_tasks();
CALL update_missing_tasknames();
CALL add_no_ui_and_admin_task_to_advanced_task_def();

-- Drop legacy SSH key procedures
DROP PROCEDURE IF EXISTS CreateProjectSshKey;
DROP PROCEDURE IF EXISTS DeleteProjectSshKey;
DROP PROCEDURE IF EXISTS CreateCustomerSshKey;
DROP PROCEDURE IF EXISTS DeleteCustomerSshKey;
DROP PROCEDURE IF EXISTS CreateSshKey;
-- Drop legacy permissions tables
DROP PROCEDURE IF EXISTS CreateCustomer;
DROP PROCEDURE IF EXISTS DeleteCustomer;
DROP PROCEDURE IF EXISTS create_users_for_orphaned_ssh_keys;
