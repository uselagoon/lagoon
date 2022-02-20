USE infrastructure;

-- Stored procedures for the API DB
-- DEPRECATED:
-- Since these proved to be awkward to work with and
-- prone to errors, we will write any further queries
-- in the API service using knex.

DELIMITER $$

DROP PROCEDURE IF EXISTS CreateProject;
$$

DROP PROCEDURE IF EXISTS DeleteProject;
$$

DROP PROCEDURE IF EXISTS CreateOrUpdateEnvironment;
$$

DROP PROCEDURE IF EXISTS CreateOrUpdateEnvironmentStorage;
$$

DROP PROCEDURE IF EXISTS DeleteEnvironment;
$$


DROP PROCEDURE IF EXISTS DeleteSshKey;
$$

DROP PROCEDURE IF EXISTS DeleteSshKeyById;
$$

DROP PROCEDURE IF EXISTS CreateOpenshift;
$$

DROP PROCEDURE IF EXISTS DeleteOpenshift;
$$

DROP PROCEDURE IF EXISTS CreateNotificationMicrosoftTeams;
$$

DROP PROCEDURE IF EXISTS DeleteNotificationMicrosoftTeams;
$$

DROP PROCEDURE IF EXISTS CreateNotificationRocketChat;
$$

DROP PROCEDURE IF EXISTS DeleteNotificationRocketChat;
$$

DROP PROCEDURE IF EXISTS CreateNotificationSlack;
$$

DROP PROCEDURE IF EXISTS DeleteNotificationSlack;
$$

DROP PROCEDURE IF EXISTS CreateNotificationEmail;
$$

DROP PROCEDURE IF EXISTS DeleteNotificationEmail;
$$

DROP PROCEDURE IF EXISTS CreateNotificationWebhook;
$$

DROP PROCEDURE IF EXISTS DeleteNotificationWebhook;
$$

DELIMITER ;
