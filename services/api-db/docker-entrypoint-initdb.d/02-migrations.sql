USE infrastructure;

-- Migrations

DELIMITER $$

CREATE OR REPLACE PROCEDURE
  add_production_environment_to_project()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'project'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'production_environment'
             )  THEN
      ALTER TABLE `project` ADD `production_environment` varchar(100);

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_ssh_to_openshift()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'openshift'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'ssh_host'
             )  THEN
      ALTER TABLE `openshift` ADD `ssh_host` varchar(300);
      ALTER TABLE `openshift` ADD `ssh_port` varchar(50);

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_project_pullrequest_to_varchar()

  BEGIN
    DECLARE column_type varchar(50);
    SELECT DATA_TYPE into column_type
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'pullrequests';
    IF (column_type = 'tinyint') THEN
      ALTER TABLE project MODIFY pullrequests varchar(300);
    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_active_systems_promote_to_project()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'project'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'active_systems_promote'
             )  THEN
      ALTER TABLE `project` ADD `active_systems_promote` varchar(300);
      UPDATE project SET active_systems_promote = 'lagoon_openshiftBuildDeploy';

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_git_type_to_deploy_type_in_environment()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'environment'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'deploy_type'
             )  THEN
      ALTER TABLE `environment` CHANGE `git_type` `deploy_type` ENUM('branch','pullrequest');

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_promote_to_deploy_type_in_environment()

  BEGIN
    DECLARE column_type_enum_deploy_type varchar(50);

    SELECT COLUMN_TYPE into column_type_enum_deploy_type
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'deploy_type';

	  IF (column_type_enum_deploy_type = "enum('branch','pullrequest')") THEN
      ALTER TABLE environment MODIFY deploy_type ENUM('branch','pullrequest','promote');
    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_autoidle_to_project()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'project'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'auto_idle'
             )  THEN
      ALTER TABLE `project` ADD `auto_idle` int(1) NOT NULL default '1';


    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_rocketchat_to_type_in_project_notification()

  BEGIN
    DECLARE column_type_project_notification_type varchar(50);

    SELECT COLUMN_TYPE into column_type_project_notification_type
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = 'project_notification'
        AND table_schema = 'infrastructure'
        AND column_name = 'type';

	  IF (column_type_project_notification_type = "enum('slack')") THEN
      ALTER TABLE project_notification MODIFY type ENUM('slack','rocketchat');
    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deleted_to_environment()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'environment'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'deleted'
             )  THEN
      ALTER TABLE `environment` DROP INDEX project_name;
      ALTER TABLE `environment` ADD `deleted` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00';
      ALTER TABLE `environment` ADD UNIQUE KEY `project_name_deleted` (`project`,`name`, `deleted`);

    END IF;

  END;
$$


CREATE OR REPLACE PROCEDURE
  add_storagecalc_to_project()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'project'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'storage_calc'
             )  THEN
      ALTER TABLE `project` ADD `storage_calc` int(1) NOT NULL default '1';

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_project_pattern_to_openshift()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'openshift'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'project_pattern'
             )  THEN
      ALTER TABLE `openshift` ADD `project_pattern` varchar(300);

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_subfolder_to_project()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'project'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'subfolder'
              ) THEN
      ALTER TABLE `project` ADD `subfolder` varchar(300);

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  delete_project_pattern_from_openshift()

  BEGIN

    IF EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'openshift'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'project_pattern'
              ) THEN
      ALTER TABLE `openshift` DROP COLUMN `project_pattern`;

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  add_openshift_project_pattern_to_project()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'project'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'openshift_project_pattern'
             )  THEN
      ALTER TABLE `project` ADD `openshift_project_pattern` varchar(300);

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_keyValue_to_key_value_in_ssh_key()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'ssh_key'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'key_value'
             )  THEN
      ALTER TABLE `ssh_key` CHANGE `keyValue` `key_value` varchar(5000) NOT NULL;

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_keyType_to_key_type_in_ssh_key()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'ssh_key'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'key_type'
             )  THEN
      ALTER TABLE `ssh_key` CHANGE `keyType` `key_type` ENUM('ssh-rsa', 'ssh-ed25519') NOT NULL DEFAULT 'ssh-rsa';

    END IF;

  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_openshift_projectname_to_openshift_project_name_in_environment()

  BEGIN

    IF NOT EXISTS(
              SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = 'environment'
                 AND table_schema = 'infrastructure'
                 AND column_name = 'openshift_project_name'
             )  THEN
      ALTER TABLE `environment` CHANGE `openshift_projectname` `openshift_project_name` varchar(100);

    END IF;

  END;
$$

DELIMITER ;

CALL add_production_environment_to_project;
CALL add_ssh_to_openshift;
CALL convert_project_pullrequest_to_varchar;
CALL add_active_systems_promote_to_project;
CALL rename_git_type_to_deploy_type_in_environment;
CALL add_enum_promote_to_deploy_type_in_environment;
CALL add_autoidle_to_project;
CALL add_enum_rocketchat_to_type_in_project_notification();
CALL add_deleted_to_environment;
CALL add_storagecalc_to_project();
CALL add_project_pattern_to_openshift();
CALL add_subfolder_to_project();
CALL delete_project_pattern_from_openshift();
CALL add_openshift_project_pattern_to_project()