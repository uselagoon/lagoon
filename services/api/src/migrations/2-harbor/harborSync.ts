import * as R from 'ramda';
import { logger } from '@lagoon/commons/dist/logs/local-logger';
import { sqlClientPool } from '../../clients/sqlClient';
import { createHarborOperations } from '../../resources/project/harborSetup';
import { Helpers as projectHelpers } from '../../resources/project/helpers';
import { query, knex } from '../../util/db';

const defaultHarborUrl = R.propOr(
  'http://harbor-harbor-core.harbor.svc.cluster.local:80',
  'HARBOR_URL',
  process.env
);

const lagoonHarborRoute = R.compose(
  R.defaultTo(defaultHarborUrl),
  R.find(R.test(/harbor-nginx/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES')
)(process.env);

const projectRegex = process.env.PROJECT_REGEX
  ? new RegExp(process.env.PROJECT_REGEX)
  : /.*/;

(async () => {
  const harborClient = createHarborOperations(sqlClientPool);

  logger.info('Syncing Harbor projects with Lagoon projects');

  // Get a list of all Lagoon projects
  const projects = await projectHelpers(sqlClientPool).getAllProjects();
  const timestamp = Math.floor(Date.now() / 1000);
  for (var i = 0; i < projects.length; i++) {
    var project = projects[i];

    if (!R.test(projectRegex, project.name)) {
      logger.info(`Skipping ${project.name}`);
      continue;
    }

    // Get project's env vars from db
    let queryBuilder = knex('env_vars')
      .where('project', '=', project.id)
      .andWhere('scope', '=', 'internal_container_registry');

    var envVars = await query(sqlClientPool, queryBuilder.toString());

    var hasURL = false;
    var hasUser = false;
    var hasPass = false;
    var localLagoonURL = '';

    // Check for Harbor variables
    for (var j = 0; j < envVars.length; j++) {
      if (envVars[j].name == 'INTERNAL_REGISTRY_URL') {
        hasURL = true;
        localLagoonURL = envVars[j].value;
      } else if (envVars[j].name == 'INTERNAL_REGISTRY_USERNAME') {
        hasUser = true;
      } else if (envVars[j].name == 'INTERNAL_REGISTRY_PASSWORD') {
        hasPass = true;
      }
    }

    // Filter for projects using this Lagoon's Harbor route
    if (localLagoonURL == lagoonHarborRoute) {
      logger.info(
        'Lagoon project: ',
        project.name,
        " is using this Lagoon's Harbor; syncing new robot account for it."
      );
      await harborClient.addProject(project.name, project.id);
      logger.info(
        'New robot account creation for Lagoon project: ',
        project.name,
        ' completed.'
      );
    }
    // No registry URL means this project doesn't have a Harbor project set up
    else if (localLagoonURL == '') {
      logger.info(
        'No Harbor URL found for Lagoon project: ',
        project.name,
        '. Creating new Harbor project using the Lagoon Harbor.'
      );
      await harborClient.addProject(project.name, project.id);
      logger.info('Added Harbor project for Lagoon project: ', project.name);
    }
    // Project not using the Harbor local to this Lagoon; do nothing
    else {
      logger.info(
        'Skipping processing of Lagoon project ',
        project.name,
        ', as it is setup to use another Harbor: ',
        localLagoonURL
      );
    }
  }

  logger.info('Harbor project sync completed');

  return;
})();
