import { Pool } from 'mariadb';
import { opendistroSecurityClient } from '../../clients/opendistroSecurityClient';
import {
  kibanaClient,
  config as kibanaClientConfig
} from '../../clients/kibanaClient';
import { getConfigFromEnv } from '../../util/config';
import { logger } from '../../loggers/logger';
import { Helpers as projectHelpers } from '../project/helpers';
import { generateOpenSearchSettingsPayload } from '../../integrations/opensearch';
import { generateOpenSearchRolePayload } from '../../integrations/opensearch/roles';
import { generateOpenSearchRoleMappingpayload } from '../../integrations/opensearch/rolesMappings';
import {
  generateIndexPatterns,
  generateOpenSearchBulkIndexPatternsPayload,
  indexPatternBulkCreateError
} from '../../integrations/opensearch/indexPatterns';
import { generateTenantPayload } from '../../integrations/opensearch/tenants';
import { ProjectTuple } from '../../integrations/opensearch';
import { isGlobalTenant } from '../../integrations/opensearch/tenants';

export const OpendistroSecurityOperations = (
  sqlClientPool: Pool,
  GroupModel
) => ({
  syncGroup: async function(
    groupName: string,
    groupProjectIDs: string
  ): Promise<void> {
    return this.syncGroupWithSpecificTenant(
      groupName,
      groupName,
      groupProjectIDs
    );
  },
  syncGroupWithSpecificTenant: async (
    groupName: string,
    tenantName: string,
    groupProjectIDs: string
  ): Promise<void> => {
    console.log(
      'asyncGroupWithSpecificTenant',
      groupName,
      tenantName,
      groupProjectIDs
    );
    // groupProjectIDs is a comma separated string of IDs, split it up and remove any entries with `''`
    const groupProjectIDsArray = groupProjectIDs
      .split(',')
      .filter(groupProjectID => groupProjectID !== '')
      .map(id => parseInt(id, 10));

    const overwriteKibanaIndexPattern = getConfigFromEnv(
      'OVERWRITE_KIBANA_INDEX_PATTERN',
      'false'
    );

    const groupProjects = await projectHelpers(sqlClientPool).getProjectsByIds(
      groupProjectIDsArray
    );
    const projects = groupProjects.map(
      (project): ProjectTuple => [
        project.id,
        project.name.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-')
      ]
    );

    try {
      const groupRolePayload = generateOpenSearchRolePayload(
        tenantName,
        groupName,
        projects
      );
      await opendistroSecurityClient.put(
        `roles/${groupName}`,
        groupRolePayload
      );
      logger.debug(`Created OpendistroSecurity role "${groupName}"`);
      console.log('groupRolePayload', groupRolePayload);
    } catch (err) {
      logger.error(`OpendistroSecurity create role error: ${err.message}`);
    }

    if (!isGlobalTenant(tenantName)) {
      try {
        const tenantPayload = generateTenantPayload(tenantName);
        await opendistroSecurityClient.put(
          `tenants/${tenantName}`,
          tenantPayload
        );
        logger.debug(`Created Tenant "${tenantName}"`);
        console.log('tenantPayload', tenantPayload);
      } catch (err) {
        logger.error(`Opendistro-Security create tenant error: ${err.message}`);
      }

      try {
        const roleMappingPayload = generateOpenSearchRoleMappingpayload([
          `${tenantName}`
        ]);
        await opendistroSecurityClient.put(
          `rolesmapping/${tenantName}`,
          roleMappingPayload
        );
        logger.debug(`Created RoleMapping "${tenantName}"`);
        console.log('roleMappingPayload', roleMappingPayload);
      } catch (err) {
        logger.error(
          `Opendistro-Security create rolemapping error: ${err.message}`
        );
      }
    }

    const indexPatterns = generateIndexPatterns(tenantName, projects);
    const kibanaTenantName = isGlobalTenant(tenantName) ? 'global' : tenantName; // global_tenant is `global` when working with the kibana api
    const queryParameter =
      overwriteKibanaIndexPattern == 'true' ? `?overwrite=true` : '';

    // @TODO Remove index-patterns that are not used anymore? like when a project is removed from the group?
    try {
      const indexPatternsPayload = generateOpenSearchBulkIndexPatternsPayload(
        tenantName,
        indexPatterns
      );
      const res = await kibanaClient.post(
        `saved_objects/_bulk_create${queryParameter}`,
        indexPatternsPayload
      );
      res.body.saved_objects.forEach(indexPattern => {
        if (indexPatternBulkCreateError(indexPattern)) {
          logger.error(
            `Kibana error during setup of index pattern: ${indexPattern.error.message}`
          );
        }
      });
      logger.debug(`Created index-patterns`);
      console.log('indexPatternsPayload', indexPatternsPayload);
    } catch (err) {
      // There was an error with the entire bulk payload
      logger.error(
        `Kibana error during setup of index patterns: ${err.message}`,
        indexPatterns
      );
    }

    try {
      const currentSettings = await kibanaClient.get(
        `${kibanaClientConfig.distro}/settings`,
        {
          headers: {
            securitytenant: kibanaTenantName
          }
        }
      );

      // Define a default Index if there is none yet
      if (!('defaultIndex' in currentSettings.body.settings)) {
        const settingsPayload = generateOpenSearchSettingsPayload(
          kibanaTenantName
        );
        await kibanaClient.post(
          `${kibanaClientConfig.distro}/settings`,
          settingsPayload
        );
        logger.debug(`Configured default index for tenant "${tenantName}"`);
        console.log('settingsPayload', settingsPayload);
      } else {
        logger.debug(
          `Configured default index for tenant "${tenantName}" was already set to "${currentSettings.body.settings.defaultIndex.userValue}"`
        );
      }
    } catch (err) {
      logger.error(
        `Kibana Error during config of default Index: ${err.message}`
      );
    }
  },
  deleteTenant: async tenantName => {
    try {
      // Delete the Tenant for this Group
      await opendistroSecurityClient.delete(`tenants/${tenantName}`);
      logger.debug(`Deleted Opendistro-Security Tenant "${tenantName}"`);
    } catch (err) {
      // 404 Errors are expected and mean that the role does not exist
      if (err.statusCode !== 404) {
        logger.error(
          `Opendistro-Security Error during deletion of tenant "${tenantName}": ${err.message}`
        );
      } else {
        logger.debug(
          `Opendistro-Security tenant "${tenantName}" did not exist, skipping deletion`
        );
      }
    }
  },
  deleteGroup: async function(groupName) {
    await this.deleteGroupWithSpecificTenant(groupName, groupName);
  },
  deleteGroupWithSpecificTenant: async function(groupName, tenantName) {
    // delete groups that have no Projects assigned to them
    try {
      await opendistroSecurityClient.delete(`roles/${groupName}`);
      logger.debug(`OpendistroSecurity Role "${groupName}" deleted`);
    } catch (err) {
      // 404 Errors are expected and mean that the role does not exist
      if (err.statusCode !== 404) {
        logger.error(
          `OpendistroSecurity Error during deletion of role "${groupName}": ${err.message}`
        );
      } else {
        logger.debug(
          `OpendistroSecurity Role "${groupName}" did not exist, skipping deletion`
        );
      }
    }

    await this.deleteTenant(tenantName);
  }
});
