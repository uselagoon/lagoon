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
--   MODIFIES SQL DATA                   /* Data access clause */
  BEGIN
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

    SELECT
        *
    FROM
        project
    WHERE
        id = LAST_INSERT_ID();

    SELECT id FROM ssh_key WHERE FIND_IN_SET(id, ssh_key_ids) > 0;
  END;

$$

DELIMITER ;
