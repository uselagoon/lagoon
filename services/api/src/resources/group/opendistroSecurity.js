// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const opendistroSecurityClient = require('../../clients/opendistroSecurityClient');
const kibanaClient = require('../../clients/kibanaClient');
const logger = require('../../logger');
const projectHelpers = require('../project/helpers');
const R = require('ramda');

const OpendistroSecurityOperations = (sqlClient /* : MariaSQL */, GroupModel) => ({
  syncGroup: async (groupName, groupProjectIDs) => {
    const groupProjectNames = [];
    // groupProjectIDs is a comma separated string of IDs, split it up and remove any entries with `''`
    const groupProjectIDsArray = groupProjectIDs.split(',').filter(groupProjectID => groupProjectID !== '');

    // Load project name by ID and add to groupProjectNames array
    for (const groupProjectID of groupProjectIDsArray) {
      const project = await projectHelpers(sqlClient).getProjectById(groupProjectID);
      const projectName = project.name;
      // Within elasticsearch we don't support any special characters, except dashes, convert all special characters to them and make it lowercase
      const openshiftProjectNameStyle = projectName
        .toLocaleLowerCase()
        .replace(/[^0-9a-z-]/g, '-');
      groupProjectNames.push(openshiftProjectNameStyle);
    }

    const groupProjectPermissions = {
      body: {
        index_permissions: [{
          index_patterns: [],
          allowed_actions: ['read'],
        }],
        tenant_permissions: [{
          tenant_patterns: [
            groupName,
          ],
          allowed_actions: [
            'kibana_all_write',
          ],
        }],
      },
    };

    // If this group has no projects assigned, we create a fake project as OpendistroSecurity needs at least one indicies permission to work.
    if (groupProjectIDsArray.length === 0) {
      groupProjectPermissions.body.index_permissions[0].index_patterns.push(`${groupName}-has-no-project`);
    } else {
      // inject project permissions into permission array
      groupProjectNames.forEach(projectName => groupProjectPermissions.body.index_permissions[0].index_patterns.push(`*-${projectName}-*`));
    }

    try {
      // Create a new OpendistroSecurity Role for this Group with read permissions for all Projects assigned to this group
      await opendistroSecurityClient.put(`roles/${groupName}`, groupProjectPermissions);
      logger.debug(`${groupName}: Created OpendistroSecurity role "${groupName}"`);
    } catch (err) {
      logger.error(`OpendistroSecurity create role error: ${err}`);
      throw new Error(`OpendistroSecurity create role error: ${err}`);
    }

    try {
      // Create a new Tenant for this Group
      await opendistroSecurityClient.put(`tenants/${groupName}`, { body: {} });
      logger.debug(`${groupName}: Created Tentant "${groupName}"`);
    } catch (err) {
      logger.error(`Opendistro-Security create tenant error: ${err}`);
      throw new Error(`Opendistro-Security create tenant error: ${err}`);
    }

    // Create index-patterns for this group
    // @TODO Remove index-patterns that are not used anymore? like when a project is removed from the group?
    const indexPatterns = [];
    indexPatterns.push('application-logs-*', 'router-logs-*', 'container-logs-*', 'lagoon-logs-*');

    groupProjectNames.forEach(projectName => indexPatterns.push(
      `application-logs-${projectName}-*`,
      `router-logs-${projectName}-*`,
      `container-logs-${projectName}-*`,
      `lagoon-logs-${projectName}-*`,
    ));

    for (const indexPattern of indexPatterns) {
      try {
        await kibanaClient.post(`saved_objects/index-pattern/${indexPattern}`, {
          body: {
            attributes: {
              title: `${indexPattern}`,
              timeFieldName: '@timestamp',
            },
          },
          headers: {
            securitytenant: groupName,
          },
        });
        logger.debug(`${groupName}: Created index-pattern "${indexPattern}"`);
      } catch (err) {
        // 409 Errors are expected and mean that there is already an index-pattern with that name defined, we ignore them
        if (err.statusCode !== 409) {
          logger.error(
            `Kibana Error during setup of index pattern "${indexPattern}": ${err}`,
          );
          // Don't fail if we have Kibana Errors, as they are "non-critical"
        } else {
          logger.debug(`${groupName}: index-pattern "${indexPattern}" already existing`);
        }
      }
    }

    try {
      const currentSettings = await kibanaClient.get('kibana/settings', {
        headers: {
          securitytenant: groupName,
        },
      });

      const defaultIndexPattern = 'container-logs-*';

      // Define a default Index if there is none yet
      if (!('defaultIndex' in currentSettings.body.settings)) {
        await kibanaClient.post('kibana/settings', {
          body: {
            changes: {
              defaultIndex: defaultIndexPattern,
              'telemetry:optIn': false, // also opt out of telemetry from xpack
            },
          },
          headers: {
            securitytenant: groupName,
          },
        });
        logger.debug(
          `${groupName}: Configured default index for tenant "${
            groupName
          }" to  "${defaultIndexPattern}"`,
        );
      } else {
        logger.debug(
          `${groupName}: Configured default index for tenant "${
            groupName
          }" was already set to "${
            currentSettings.body.settings.defaultIndex.userValue
          }"`,
        );
      }
    } catch (err) {
      logger.error(`Kibana Error during config of default Index: ${err}`);
      // Don't fail if we have Kibana Errors, as they are "non-critical"
    }
  },
  deleteGroup: async (groupName) => {
    // delete groups that have no Projects assigned to them
    try {
      await opendistroSecurityClient.delete(`roles/${groupName}`);
      logger.debug(`${groupName}: OpendistroSecurity Role "${groupName}" deleted`);
    } catch (err) {
      // 404 Errors are expected and mean that the role does not exist
      if (err.statusCode !== 404) {
        logger.error(
          `OpendistroSecurity Error during deletion of role "${groupName}": ${err}`,
        );
      } else {
        logger.debug(`OpendistroSecurity Role "${groupName}" did not exist, skipping deletion`);
      }
    }

    try {
      // Create a new Tenant for this Group
      await opendistroSecurityClient.delete(`tenants/${groupName}`);
      logger.debug(`${groupName}: Deleted Opendistro-Security Tentant "${groupName}"`);
    } catch (err) {
      // 404 Errors are expected and mean that the role does not exist
      if (err.statusCode !== 404) {
        logger.error(
          `Opendistro-Security Error during deletion of tenant "${groupName}": ${err}`,
        );
      } else {
        logger.debug(`Opendistro-Security tenant "${groupName}" did not exist, skipping deletion`);
      }
    }
  },
});

module.exports = { OpendistroSecurityOperations };
