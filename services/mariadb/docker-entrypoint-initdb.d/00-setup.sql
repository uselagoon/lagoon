USE infrastructure;

-- Tables

CREATE TABLE IF NOT EXISTS ssh_key (
       id            int NOT NULL auto_increment PRIMARY KEY,
       name          varchar(100) NOT NULL,
       keyValue      varchar(5000) NOT NULL,
       keyType       ENUM('ssh-rsa', 'ssh-ed25519') NOT NULL DEFAULT 'ssh-rsa',
       created       timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer (
       id             int NOT NULL auto_increment PRIMARY KEY,
       name           varchar(50) UNIQUE,
       comment        text,
       private_key    varchar(5000),
       created        timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS openshift (
       id              int NOT NULL auto_increment PRIMARY KEY,
       name            varchar(50) UNIQUE,
       console_url     varchar(300),
       token           varchar(1000),
       router_pattern  varchar(300),
       project_user    varchar(100),
       ssh_host        varchar(300),
       ssh_port        varchar(50),
       created         timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_slack (
       id          int NOT NULL auto_increment PRIMARY KEY,
       name        varchar(50) UNIQUE,
       webhook     varchar(300),
       channel     varchar(300)
);


CREATE TABLE IF NOT EXISTS project (
       id                     int NOT NULL auto_increment PRIMARY KEY,
       name                   varchar(100) UNIQUE,
       customer               int REFERENCES customer (id),
       git_url                varchar(300),
       active_systems_deploy  varchar(300),
       active_systems_remove  varchar(300),
       branches               varchar(300),
       pullrequests           boolean,
       production_environment varchar(100),
       openshift              int REFERENCES openshift (id),
       created                timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environment (
       id                     int NOT NULL auto_increment PRIMARY KEY,
       name                   varchar(100),
       project                int REFERENCES project (id),
       git_type               ENUM('branch', 'pullrequest') NOT NULL,
       environment_type       ENUM('production', 'development') NOT NULL,
       openshift_projectname  varchar(100),
       updated                timestamp DEFAULT CURRENT_TIMESTAMP,
       created                timestamp DEFAULT CURRENT_TIMESTAMP,
       UNIQUE KEY `project_name` (`project`,`name`)
);

-- Junction Tables

CREATE TABLE IF NOT EXISTS project_notification (
       nid              int,
       pid              int REFERENCES project (id),
       type             ENUM('slack') NOT NULL,
       CONSTRAINT project_notification_pkey PRIMARY KEY (nid, pid, type)
);

CREATE TABLE IF NOT EXISTS customer_ssh_key (
       cid int REFERENCES customer (id),
       skid int REFERENCES ssh_key (id),
       CONSTRAINT customer_ssh_key_pkey PRIMARY KEY (cid, skid)
);

CREATE TABLE IF NOT EXISTS project_ssh_key (
       pid int REFERENCES project (id),
       skid int REFERENCES ssh_key (id),
       CONSTRAINT project_ssh_key_pkey PRIMARY KEY (pid, skid)
);


DROP view IF EXISTS foo;
CREATE VIEW foo
AS
  SELECT skid, GROUP_CONCAT(DISTINCT r.pid SEPARATOR ',')
  FROM
  (SELECT
    p.id as pid, csk.skid as skid
  FROM project p
  INNER JOIN customer c ON p.customer = c.id
  INNER JOIN customer_ssh_key csk ON csk.cid = c.id
  UNION DISTINCT
  SELECT psk.pid AS pid, psk.skid as skid
  FROM project_ssh_key psk) r;


DROP VIEW IF EXISTS permission;
CREATE VIEW permission
AS
  SELECT
    sk.id AS keyId,
    CONCAT(sk.keyType, ' ', sk.keyValue) AS sshKey,
    (SELECT
      GROUP_CONCAT(DISTINCT csk.cid SEPARATOR ',')
      FROM customer_ssh_key csk
      WHERE csk.skid = sk.id) as customers,
    (SELECT GROUP_CONCAT(DISTINCT r.pid SEPARATOR ',')
      FROM
      (SELECT DISTINCT
        p.id as pid, csk.skid as skid
      FROM customer_ssh_key csk
      INNER JOIN customer c ON csk.cid = c.id
      INNER JOIN project p ON p.customer = c.id
      UNION DISTINCT
      SELECT psk.pid AS pid, psk.skid as skid
      FROM project_ssh_key psk) r
      WHERE r.skid = sk.id
    ) AS projects
  FROM ssh_key sk;

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

DELIMITER ;

CALL add_production_environment_to_project;
CALL add_ssh_to_openshift;
