-- Types

CREATE DATABASE infrastructure;

GRANT ALL PRIVILEGES ON DATABASE infrastructure TO postgres;

-- Connect to the newly created database
\c infrastructure;

CREATE TYPE sshKeyType AS ENUM ('ssh-rsa', 'ssh-ed25519');

-- Tables

CREATE TABLE IF NOT EXISTS ssh_key (
       id            serial PRIMARY KEY,
       name          varchar(100),
       key           varchar(500),
       type          sshKeyType DEFAULT 'ssh-rsa',
       created       timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer (
       id             serial PRIMARY KEY,
       name           varchar(50) UNIQUE,
       comment        text,
       private_key    varchar(500),
       created        timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS openshift (
       id              serial PRIMARY KEY,
       name            varchar(50) UNIQUE,
       console_url     varchar(300),
       registry        varchar(500),
       token           varchar(1000),
       username        varchar(100),
       password        varchar(100),
       router_pattern  varchar(300),
       project_user    varchar(100),
       created         timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slack (
       id          serial PRIMARY KEY,
       webhook     varchar(300),
       channel     varchar(300)
);

CREATE TABLE IF NOT EXISTS project (
       id                     serial PRIMARY KEY,
       name                   varchar(100) UNIQUE,
       customer               integer REFERENCES customer (id),
       git_url                varchar(300),
       slack                  integer REFERENCES slack (id),
       active_systems_deploy  varchar(300),
       active_systems_remove  varchar(300),
       branches               varchar(300),
       pullrequests           boolean,
       openshift              integer REFERENCES openshift (id),
       created                timestamp DEFAULT CURRENT_TIMESTAMP
);


-- Junction Tables

CREATE TABLE IF NOT EXISTS customer_ssh_key (
       cid integer REFERENCES customer (id),
       skid integer REFERENCES ssh_key (id),
       CONSTRAINT customer_ssh_key_pkey PRIMARY KEY (cid, skid)
);

CREATE TABLE IF NOT EXISTS project_ssh_key (
       pid integer REFERENCES project (id),
       skid integer REFERENCES ssh_key (id),
       CONSTRAINT project_ssh_key_pkey PRIMARY KEY (pid, skid)
);
