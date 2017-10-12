
# Dump of table customer
# ------------------------------------------------------------

LOCK TABLES `customer` WRITE;

TRUNCATE TABLE `customer`;

INSERT INTO `customer` (`id`, `name`, `comment`, `private_key`)
VALUES
	(1,'credentialtestclient','used to test the cli',NULL),
	(2,'deploytestclient',NULL,'-----BEGIN RSA PRIVATE KEY-----\nMIIJKQIBAAKCAgEAuW/QMG+osFkc9c/kA8C5Ur7acYP+6Ue0X/pCU95IUBoi7l+E\nJNmgwq7dXyp3Y8lLo+eaHEXPDpRMawPBT32W6Z32jV31YfU5cm4YyFlB7S23PYIg\nqA7oldkxG+mVv3rCpVbVqJs32P548DwLlxFNot4+WMVULmdMvgDeMnGuFdcu8tgZ\nVDr6eakr8//D3ASXoGqHrEkrhaUFgke/PP4tLFESYmhuvrWTfmxlUpyYLW10Cb3N\nK+OWrtzy+Y8jHAKWxzgg0FCIlsguoqVthCGE1AVTvNEFRI8ppgWaWREJf9A0DxMw\nXagouF+MJsIaGp+4UCUO3TXapkS/luC++cjzcp4DYCVTU5SFzh13r6TbJB//x1Jc\nBKeFjx7k++gWU93KtUQmrZ+ojLBYsKREpPccg2xFT38SgK++3EaRSB7iXe2pg405\nO/yj9'),
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
	(1,'local','https://192.168.99.100:8443/',NULL,'${sitegroup}.${branch}.192.168.99.100.nip.io','developer');

UNLOCK TABLES;


# Dump of table project
# ------------------------------------------------------------

LOCK TABLES `project` WRITE;

TRUNCATE TABLE `project`;

INSERT INTO `project` (`id`, `name`, `customer`, `git_url`, `slack`, `active_systems_deploy`, `active_systems_remove`, `branches`, `pullrequests`, `openshift`)
VALUES
	(1,'ci-github',2,'ssh://git@10.0.2.2:32768/git/github.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(2,'ci-gitlab',2,'ssh://git@10.0.2.2:32768/git/gitlab.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(3,'ci-bitbucket',2,'ssh://git@10.0.2.2:32768/git/bitbucket.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(4,'ci-rest',2,'ssh://git@10.0.2.2:32768/git/rest.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(5,'ci-node',2,'ssh://git@10.0.2.2:32768/git/node.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(6,'ci-multisitegroup1',2,'ssh://git@10.0.2.2:32768/git/multisitegroup1.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(7,'ci-multisitegroup2',2,'ssh://git@10.0.2.2:32768/git/multisitegroup2.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(8,'ci-drupal',2,'ssh://git@10.0.2.2:32768/git/drupal.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1),
	(9,'credentialtest',1,'ssh://git@10.0.2.2:32768/git/credentialtest.git',1,'lagoon_openshiftBuildDeploy','lagoon_openshiftRemove','true',NULL,1);

UNLOCK TABLES;


# Dump of table project_ssh_key
# ------------------------------------------------------------

LOCK TABLES `project` WRITE;

TRUNCATE TABLE `project`;

#### nothing here yet

UNLOCK TABLES;

# Dump of table slack
# ------------------------------------------------------------

LOCK TABLES `slack` WRITE;

TRUNCATE TABLE `slack`;

INSERT INTO `slack` (`id`, `webhook`, `channel`)
VALUES
	(1,'https://hooks.slack.com/services/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','lagoon-local-ci');

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


