// @flow

const R = require('ramda');
const searchguardClient = require('../../clients/searchguardClient');
const kibanaClient = require('../../clients/kibanaClient');
const logger = require('../../logger');

const { getCustomerById } = require('../customer/helpers');

const SearchguardOperations = {
  addProject: async (project /* : any */) => {
    const customer = await getCustomerById(project.customer);

    try {
    // Create a new SearchGuard Role for this project with the same name as the Project
      await searchguardClient.put(`roles/${project.name}`, {
        body: {
          indices: {
            [`*-${project.name}-*`]: {
              '*': ['READ'],
            },
          },
          tenants: {
            [customer.name]: 'RW',
          },
        },
      });
      logger.debug(`Created SearchGuard role "${project.name}"`);
    } catch (err) {
      logger.error(`SearchGuard create role error: ${err}`);
      throw new Error(`SearchGuard create role error: ${err}`);
    }

    // Create index-patterns for this project

    for (const log of [
      'application-logs',
      'router-logs',
      'container-logs',
      'lagoon-logs',
    ]) {
      try {
        await kibanaClient.post(
          `saved_objects/index-pattern/${log}-${project.name}-*`,
          {
            body: {
              attributes: {
                title: `${log}-${project.name}-*`,
                timeFieldName: '@timestamp',
              },
            },
            headers: {
              sgtenant: customer.name,
            },
          },
        );
        logger.debug(`Created index-pattern "${log}-${project.name}-*"`);
      } catch (err) {
      // 409 Errors are expected and mean that there is already an index-pattern with that name defined, we ignore them
        if (err.statusCode !== 409) {
          logger.error(
            `Kibana Error during setup of index pattern ${log}-${
              project.name
            }-*: ${err}`,
          );
        // Don't fail if we have Kibana Errors, as they are "non-critical"
        } else {
          logger.debug(`index-pattern "${log}-${project.name}-*" already existing`);
        }
      }
    }

    try {
      const currentSettings = await kibanaClient.get('kibana/settings', {
        headers: {
          sgtenant: customer.name,
        },
      });
      // Define a default Index if there is none yet
      if (!('defaultIndex' in currentSettings.body.settings)) {
        await kibanaClient.post('kibana/settings', {
          body: {
            changes: {
              defaultIndex: `container-logs-${project.name}-*`,
              'telemetry:optIn': false, // also opt out of telemetry from xpack
            },
          },
          headers: {
            sgtenant: customer.name,
          },
        });
        logger.debug(`Configured default index for tenant "${customer.name}" to  "container-logs-${project.name}-*"`);
      } else {
        logger.debug(`Configured default index for tenant "${customer.name}" was already set to "${currentSettings.body.settings.defaultIndex.userValue}"`);
      }
    } catch (err) {
      logger.error(`Kibana Error during config of default Index: ${err}`);
      // Don't fail if we have Kibana Errors, as they are "non-critical"
    }
  },
};

module.exports = SearchguardOperations;
