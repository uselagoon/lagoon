USE infrastructure;

-- Tables

CREATE TABLE IF NOT EXISTS ssh_key (
       id            int NOT NULL auto_increment PRIMARY KEY,
       name          varchar(100) NOT NULL,
       key_value     varchar(5000) NOT NULL,
       key_type      ENUM('ssh-rsa', 'ssh-ed25519') NOT NULL DEFAULT 'ssh-rsa',
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

CREATE TABLE IF NOT EXISTS notification_rocketchat (
       id          int NOT NULL auto_increment PRIMARY KEY,
       name        varchar(50) UNIQUE,
       webhook     varchar(300),
       channel     varchar(300)
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
       subfolder              varchar(300),
       active_systems_deploy  varchar(300),
       active_systems_promote varchar(300),
       active_systems_remove  varchar(300),
       branches               varchar(300),
       pullrequests           varchar(300),
       production_environment varchar(100),
       auto_idle              int(1) NOT NULL default 1,
       storage_calc           int(1) NOT NULL default 1,
       openshift              int REFERENCES openshift (id),
       openshift_project_pattern varchar(300),
       created                timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environment (
       id                     int NOT NULL auto_increment PRIMARY KEY,
       name                   varchar(100),
       project                int REFERENCES project (id),
       deploy_type            ENUM('branch', 'pullrequest', 'promote') NOT NULL,
       environment_type       ENUM('production', 'development') NOT NULL,
       openshift_project_name  varchar(100),
       updated                timestamp DEFAULT CURRENT_TIMESTAMP,
       created                timestamp DEFAULT CURRENT_TIMESTAMP,
       deleted                timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
       UNIQUE KEY `project_name_deleted` (`project`,`name`, `deleted`)
);

CREATE TABLE IF NOT EXISTS environment_storage (
       id                       int NOT NULL auto_increment PRIMARY KEY,
       environment              int REFERENCES environment (id),
       persistent_storage_claim varchar(100),
       bytes_used               bigint,
       updated                  date,
       UNIQUE KEY `environment_persistent_storage_claim_updated` (`environment`,`persistent_storage_claim`, `updated`)
);

-- Junction Tables

CREATE TABLE IF NOT EXISTS project_notification (
       nid              int,
       pid              int REFERENCES project (id),
       type             ENUM('slack','rocketchat') NOT NULL,
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
