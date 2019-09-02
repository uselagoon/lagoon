// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const searchguardClient = require('../../clients/searchguardClient');
const kibanaClient = require('../../clients/kibanaClient');
const logger = require('../../logger');
const projectHelpers = require('../project/helpers');
const R = require('ramda');

const SearchguardOperations = (sqlClient /* : MariaSQL */, GroupModel) => ({
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
        indices: {},
        tenants: {
          [groupName]: 'RW',
        },
      },
    };

    // If this group has no projects assigned, we create a fake project as SearchGuard needs at least one indicies permission to work.
    if (groupProjectIDsArray.length === 0) {
      groupProjectPermissions.body.indices[`${groupName}-has-no-project`] = { '*': ['READ'] };
    } else {
      // inject project permissions into permission array
      groupProjectNames.forEach(projectName => groupProjectPermissions.body.indices[`*-${projectName}-*`] = { '*': ['READ'] });
    }

    try {
      // Create a new SearchGuard Role for this Group with read permissions for all Projects assigned to this group
      await searchguardClient.put(`roles/${groupName}`, groupProjectPermissions);
      logger.debug(`${groupName}: Created SearchGuard role "${groupName}"`);
    } catch (err) {
      logger.error(`SearchGuard create role error: ${err}`);
      throw new Error(`SearchGuard create role error: ${err}`);
    }

    // Create or Update the lagoon_all_access role which has access to all tenants (all groups)
    const groups = await GroupModel.loadAllGroups();
    const groupNames = R.pluck('name', groups);

    const tenants = R.reduce(
      (acc, elem) => {
        acc[elem] = 'RW';
        return acc;
      },
      { admin_tenant: 'RW' },
      groupNames,
    );

    try {
      await searchguardClient.put('roles/lagoon_all_access', {
        body: {
          cluster: ['UNLIMITED'],
          indices: {
            '*': {
              '*': ['UNLIMITED'],
            },
          },
          tenants,
        },
      });
      logger.info(`${groupName}: Created/Updated lagoon_all_access role in SearchGuard`);
    } catch (err) {
      logger.error(`SearchGuard Error while creating lagoon_all_access role: ${err}`);
      throw new Error(
        `SearchGuard Error while creating lagoon_all_access role: ${err}`,
      );
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
            sgtenant: groupName,
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
          sgtenant: groupName,
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
            sgtenant: groupName,
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
      await searchguardClient.delete(`roles/${groupName}`);
      logger.debug(`${groupName}: SearchGuard Role "${groupName}" deleted`);
    } catch (err) {
      // 404 Errors are expected and mean that the role does not exist
      if (err.statusCode !== 404) {
        logger.error(
          `SearchGuard Error during deletion of role "${groupName}": ${err}`,
        );
      } else {
        logger.debug(`SearchGuard Role "${groupName}" did not exist, skipping deletion`);
      }
    }
  },
});

module.exports = { SearchguardOperations };
