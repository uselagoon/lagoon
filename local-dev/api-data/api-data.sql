
# Dump of table customer
# ------------------------------------------------------------

LOCK TABLES `customer` WRITE;

TRUNCATE TABLE `customer`;

INSERT INTO `customer` (`id`, `name`, `comment`, `private_key`)
VALUES
	(1,'credentialtestclient','used to test the cli',NULL),
	(2,'deploytestclient',NULL,'-----BEGIN RSA PRIVATE KEY-----\n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\n-----END RSA PRIVATE KEY-----'),
	(3,'admin','this ssh key is used for authenticating other services against the api, do not remove plz',NULL);

UNLOCK TABLES;


# Dump of table customer_ssh_key
# ------------------------------------------------------------

LOCK TABLES `customer_ssh_key` WRITE;

TRUNCATE TABLE `customer_ssh_key`;

INSERT INTO `customer_ssh_key` (`cid`, `skid`)
VALUES
	(1,1),
	(1,3);

UNLOCK TABLES;


# Dump of table openshift
# ------------------------------------------------------------

LOCK TABLES `openshift` WRITE;

TRUNCATE TABLE `openshift`;

INSERT INTO `openshift` (`id`, `name`, `console_url`, `token`, `router_pattern`, `project_user`)
VALUES
	(1,'local','https://192.168.99.100:8443/',NULL,'${project}.${branch}.192.168.99.100.nip.io','developer'),
	(2,'kickstart','[replace me with OpenShift console URL]','[replace me with OpenShift Token]',NULL,NULL);

UNLOCK TABLES;


# Dump of table project
# ------------------------------------------------------------

LOCK TABLES `project` WRITE;

TRUNCATE TABLE `project`;

INSERT INTO `project` (`id`, `name`, `customer`, `git_url`, `slack`, `active_systems_deploy`, `active_systems_remove`, `branches`, `pullrequests`, `openshift`)
VALUES
	(1,'ci-github',2,'ssh://git@10.0.2.2:32774/git/github.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(2,'ci-gitlab',2,'ssh://git@10.0.2.2:32774/git/gitlab.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(3,'ci-bitbucket',2,'ssh://git@10.0.2.2:32774/git/bitbucket.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(4,'ci-rest',2,'ssh://git@10.0.2.2:32774/git/rest.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(5,'ci-node',2,'ssh://git@10.0.2.2:32774/git/node.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(6,'ci-multiproject1',2,'ssh://git@10.0.2.2:32774/git/multiproject.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(7,'ci-multiproject2',2,'ssh://git@10.0.2.2:32774/git/multiproject.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(8,'ci-drupal',2,'ssh://git@10.0.2.2:32774/git/drupal.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(9,'credentialtest',1,'ssh://git@10.0.2.2:32774/git/credentialtest.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(10,'ci-nginx',2,'ssh://git@10.0.2.2:32774/git/nginx.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(11,'lagoon',2,'git@github.com:amazeeio/lagoon.git',2,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,2);

UNLOCK TABLES;


# Dump of table project_ssh_key
# ------------------------------------------------------------

LOCK TABLES `project_ssh_key` WRITE;

TRUNCATE TABLE `project_ssh_key`;

#### nothing here yet

UNLOCK TABLES;

# Dump of table slack
# ------------------------------------------------------------

LOCK TABLES `slack` WRITE;

TRUNCATE TABLE `slack`;

INSERT INTO `slack` (`id`, `name`, `webhook`, `channel`)
VALUES
	(1,'lagoon-local-ci', 'https://hooks.slack.com/services/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','lagoon-local-ci'),
	(2,'lagoon-kickstart', 'https://hooks.slack.com/services/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','lagoon-kickstart');

UNLOCK TABLES;


# Dump of table ssh_key
# ------------------------------------------------------------

LOCK TABLES `ssh_key` WRITE;

TRUNCATE TABLE `ssh_key`;

INSERT INTO `ssh_key` (`id`, `name`, `keyValue`, `keyType`)
VALUES
	(1,'local-cli','AAAAB3NzaC1yc2EAAAADAQABAAACAQDEZlms5XsiyWjmnnUyhpt93VgHypse9Bl8kNkmZJTiM3Ex/wZAfwogzqd2LrTEiIOWSH1HnQazR+Cc9oHCmMyNxRrLkS/MEl0yZ38Q+GDfn37h/llCIZNVoHlSgYkqD0MQrhfGL5AulDUKIle93dA6qdCUlnZZjDPiR0vEXR36xGuX7QYAhK30aD2SrrBruTtFGvj87IP/0OEOvUZe8dcU9G/pCoqrTzgKqJRpqs/s5xtkqLkTIyR/SzzplO21A+pCKNax6csDDq3snS8zfx6iM8MwVfh8nvBW9seax1zBvZjHAPSTsjzmZXm4z32/ujAn/RhIkZw3ZgRKrxzryttGnWJJ8OFyF31JTJgwWWuPdH53G15PC83ZbmEgSV3win51RZRVppN4uQUuaqZWG9wwk2a6P5aen1RLCSLpTkd2mAEk9PlgmJrf8vITkiU9pF9n68ENCoo556qSdxW2pxnj','ssh-rsa'),
	(2,'admin','AAAAB3NzaC1yc2EAAAADAQABAAACAQC5b9Awb6iwWRz1z+QDwLlSvtpxg/7pR7Rf+kJT3khQGiLuX4Qk2aDCrt1fKndjyUuj55ocRc8OlExrA8FPfZbpnfaNXfVh9TlybhjIWUHtLbc9giCoDuiV2TEb6ZW/esKlVtWomzfY/njwPAuXEU2i3j5YxVQuZ0y+AN4yca4V1y7y2BlUOvp5qSvz/8PcBJegaoesSSuFpQWCR788/i0sURJiaG6+tZN+bGVSnJgtbXQJvc0r45au3PL5jyMcApbHOCDQUIiWyC6ipW2EIYTUBVO80QVEjymmBZpZEQl/0DQPEzBdqCi4X4wmwhoan7hQJQ7dNdqmRL+W4L75yPNyngNgJVNTlIXOHXevpNskH//HUlwEp4WPHuT76BZT3cq1RCatn6iMsFiwpESk9xyDbEVPfxKAr77cRpFIHuJd7amDjTk7/KP0PTliO2ViCyjDudiajwNh7XmY0ZqYrhHI','ssh-rsa');

UNLOCK TABLES;


