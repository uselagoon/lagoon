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
  for(var i=0; i < projects.length; i++) {
    var project = projects[i];

    // Get project's env vars
    var envVars = await query(sqlClient, `SELECT * FROM env_vars WHERE project='${project.id}';`);
    var hasVars = false;
    if (envVars != null) {
      // Check for Harbor variables
      for (var j = 0; j < envVars.length; j++) {
        if (envVars[j].name == "INTERNAL_REGISTRY_PASSWORD") {
          hasVars = true;
        }
      };
    };

    if (! hasVars) {
      await harborClient.addProject(project.name, project.id);
      logger.info('Added Harbor project for Lagoon project: ', project.name);
    } else {
      logger.info(`Harbor project for Lagoon project ${project.name} already exists!`);
    };
  };

  logger.info('Harbor project sync completed');

  sqlClient.destroy();
  return
})();
