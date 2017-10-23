-- CREATE TYPE ProjectTable AS TABLE (
--     name                   varchar(100),
--     customer               varchar(50),
--     git_url                varchar(300),
--     slack                  int,
--     active_systems_deploy  varchar(300),
--     active_systems_remove  varchar(300),
--     branches               varchar(300),
--     pullrequests           boolean,
--     openshift              varchar(50),
-- )

DROP PROCEDURE IF EXISTS CreateProject;

DELIMITER $$

CREATE PROCEDURE
  CreateProject
  (
    IN name                   varchar(100),
    IN customer               varchar(50),
    IN git_url                varchar(300),
    IN slackId                int,
    IN active_systems_deploy  varchar(300),
    IN active_systems_remove  varchar(300),
    IN branches               varchar(300),
    IN pullrequests           boolean,
    IN openshift              varchar(50),
    IN ssh_key_ids            text
  )
  BEGIN
    DECLARE new_pid int;

    DROP TEMPORARY TABLE IF EXISTS existing_ssh_keys;
    CREATE TEMPORARY TABLE IF NOT EXISTS existing_ssh_keys AS
      (SELECT
        id
      FROM ssh_key
      WHERE FIND_IN_SET(id, ssh_key_ids) > 0);

    INSERT INTO project (
        name,
        customer,
        git_url,
        slack,
        active_systems_deploy,
        active_systems_remove,
        branches,
        pullrequests,
        openshift
    )
    SELECT
        name,
        c.id,
        git_url,
        slackId,
        active_systems_deploy,
        active_systems_remove,
        branches,
        pullrequests,
        os.id
    FROM
        openshift AS os,
        customer AS c
    WHERE
        os.name = openshift AND
        c.name = customer;

    -- Now add the ssh-key relation to the newly created project
    SET new_pid = LAST_INSERT_ID();

    INSERT INTO project_ssh_key (pid, skid)
    SELECT
      new_pid,
      id
    FROM existing_ssh_keys;

    -- Return the constructed project
    SELECT * from project WHERE id = new_pid;
  END;

$$

DELIMITER ;
