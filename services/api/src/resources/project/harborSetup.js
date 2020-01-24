// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const harborClient = require('../../clients/harborClient');
const logger = require('../../logger');
const R = require('ramda');
const Sql = require('../env-variables/sql');

const lagoonHarborRoute = R.compose(
  R.defaultTo('http://172.17.0.1:8084'),
  R.find(R.test(/harbor-nginx/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES'),
)(process.env);

const HarborOperations = (sqlClient /* : MariaSQL */) => ({
  addEnvironment: async (openshiftProjectName, environmentID) => {
    // Create harbor project
    try {
      await harborClient.post(`projects/`, json = {
        "count_limit": -1,
        "project_name": "${openshiftProjectName}",
        "storage_limit": -1,
        "metadata": {
          "auto_scan": "true",
          "reuse_sys_cve_whitelist": "true",
          "public": "false"
        }
      })
      logger.debug(`Harbor project ${openshiftProjectName} created!`)
    } catch (err) {
      // 409 means project already exists
      // 201 means project created successfully
      if (err.statusCode == 409) {
        logger.error(`Unable to create the harbor project "${openshiftProjectName}", as it already exists in harbor!`)
      } else {
        logger.error(`Unable to create the harbor project "${openshiftProjectName}" !!`)
      }
    }

    // Get new harbor project's id
    try {
      harborProjectID = await harborClient.get(`projects?name=${propenshiftProjectNameojectName}`)
      logger.debug(`Got the harbor project id for project ${openshiftProjectName} successfully!`)
    } catch (err) {
      // 409 means project already exists
      // 201 means project created successfully
      if (err.statusCode == 404) {
        logger.error(`Unable to get the harbor project id of "${openshiftProjectName}", as it does not exist in harbor!`)
      } else {
        logger.error(`Unable to get the harbor project id of "${openshiftProjectName}" !!`)
      }
    }

    // Create robot account for new harbor project
    try {
      harborTokenInfo = await harborClient.post(`projects/${harborProjectID}/robots`, json = {
        "name": "${openshiftProjectName}",
        "access": [
          {
            "resource": "/project/${harborProjectID}/repository",
            "action": "push"
          }
        ]
      }, responseType: 'json')
      logger.debug(`Harbor project ${openshiftProjectName} created!`)
    } catch (err) {
      // 409 means project already exists
      // 201 means project created successfully
      if (err.statusCode == 409) {
        logger.error(`Unable to create a robot account for harbor project "${openshiftProjectName}", as a robot account of the same name already exists!`)
      } else {
        logger.error(`Unable to create a robot account for harbor project "${openshiftProjectName}" !!`)
      }
    }

    // Set Harbor env vars for lagoon environment
    const {
      info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertEnvVariable({
        "name": "INTERNAL_REGISTRY_URL",
        "value": lagoonHarborRoute,
        "scope": INTERNAL_CONTAINER_REGISTRY,
        "environment": environmentID,
      }),
    );
    logger.debug(`Environment variable INTERNAL_REGISTRY_URL for ${openshiftProjectName} created!`)

    const {
      info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertEnvVariable({
        "name": "INTERNAL_REGISTRY_USERNAME",
        "value": harborTokenInfo.name,
        "scope": INTERNAL_CONTAINER_REGISTRY,
        "environment": environmentID,
      }),
    );
    logger.debug(`Environment variable INTERNAL_REGISTRY_USERNAME for ${openshiftProjectName} created!`)

    const {
      info: { insertId },
    } = await query(
      sqlClient,
      Sql.insertEnvVariable({
        "name": "INTERNAL_REGISTRY_PASSWORD",
        "value": harborTokenInfo.token,
        "scope": INTERNAL_CONTAINER_REGISTRY,
        "environment": environmentID,
      }),
    );
    logger.debug(`Environment variable INTERNAL_REGISTRY_PASSWORD for ${openshiftProjectName} created!`)
  }
})

module.exports = { HarborOperations };
