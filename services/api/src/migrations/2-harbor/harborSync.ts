import * as R from 'ramda';
import { logger } from '@lagoon/commons/src/local-logging';
import { getSqlClient } from '../../clients/sqlClient';
import createHarborOperations from '../../resources/project/harborSetup';
import projectHelpers from '../../resources/project/helpers';
import { query, prepare } from '../../util/db';

(async () => {
  const sqlClient = getSqlClient();
  const harborClient = createHarborOperations(sqlClient);

  logger.info('Syncing Harbor projects with Lagoon projects');
  // Get a list of all Lagoon projects
  const projects = await projectHelpers(sqlClient).getAllProjects();
  const timestamp = Math.floor(Date.now() / 1000)
  for(var i=0; i < projects.length; i++) {
    var project = projects[i];

    // Get project's env vars
    var envVars = await query(sqlClient, `SELECT * FROM env_vars WHERE project='${project.id}';`);
    var hasURL = false;
    var hasUser = false;
    var hasPass = false;
    var localLagoonURL = "";

    // Check for Harbor variables
    for (var j = 0; j < envVars.length; j++) {
      if (envVars[j].name == "INTERNAL_REGISTRY_URL") {
        hasURL = true;
        localLagoonURL = envVars[j].value
      } else if (envVars[j].name == "INTERNAL_REGISTRY_USERNAME") {
        hasUser = true;
      } else if (envVars[j].name == "INTERNAL_REGISTRY_PASSWORD") {
        hasPass = true;
      }
    };

    // Filter for projects using this Lagoon's Harbor route
    if (localLagoonURL == harborClient.lagoonHarborRoute) {
      // timestamp is the var to keep this random

    }
    // No registry URL means this project doesn't have a Harbor project set up
    else if (localLagoonURL == "") {
      logger.info('No Harbor URL found for Lagoon project: ', project.name, ". Creating new Harbor project using the Lagoon Harbor.");
      await harborClient.addProject(project.name, project.id);
      logger.info('Added Harbor project for Lagoon project: ', project.name);
    }
    // Project not using the Harbor local to this Lagoon; do nothing
    else {
      logger.info('Lagoon project ', project.name, " is setup to use another Harbor: ", harborClient.lagoonHarborRoute);
    }

  };

  logger.info('Harbor project sync completed');

  sqlClient.destroy();
  return
})();
