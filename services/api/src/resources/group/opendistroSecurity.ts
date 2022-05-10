import { Pool } from 'mariadb';
import { opendistroSecurityClient } from '../../clients/opendistroSecurityClient';
import { kibanaClient } from '../../clients/kibanaClient';
import { getConfigFromEnv } from '../../util/config';
import { logger } from '../../loggers/logger';
import { Helpers as projectHelpers } from '../project/helpers';

export const OpendistroSecurityOperations = (
  sqlClientPool: Pool,
  GroupModel
) => ({
  syncGroup: async function(groupName, groupProjectIDs) {
    return this.syncGroupWithSpecificTenant(groupName, groupName, groupProjectIDs);
  },
  syncGroupWithSpecificTenant: async (groupName, tenantName, groupProjectIDs) => {
    const groupProjectNames = [];
    // groupProjectIDs is a comma separated string of IDs, split it up and remove any entries with `''`
    const groupProjectIDsArray = groupProjectIDs
      .split(',')
      .filter(groupProjectID => groupProjectID !== '');

    const overwriteKibanaIndexPattern = getConfigFromEnv('OVERWRITE_KIBANA_INDEX_PATTERN', 'false');

    // Load project name by ID and add to groupProjectNames array
    for (const groupProjectID of groupProjectIDsArray) {
      try {
        const project = await projectHelpers(sqlClientPool).getProjectById(
          groupProjectID
        );
        const projectName = project.name;
        // Within elasticsearch we don't support any special characters, except dashes, convert all special characters to them and make it lowercase
        const openshiftProjectNameStyle = projectName
          .toLocaleLowerCase()
          .replace(/[^0-9a-z-]/g, '-');
        groupProjectNames.push(openshiftProjectNameStyle);
      } catch (error) {
        logger.error(
          `Error processing project id '${groupProjectID}' of '${groupName}: ${error}`
        );
      }
    }

    const groupProjectPermissions = {
      body: {
        cluster_permissions: [
          'cluster:admin/opendistro/reports/menu/download'
        ],
        index_permissions: [
          {
            index_patterns: [],
            allowed_actions: ['read','indices:monitor/settings/get']
          }
        ],
        tenant_permissions: [
          {
            tenant_patterns: [tenantName],
            allowed_actions: [tenantName == 'global_tenant' ? 'kibana_all_read' : 'kibana_all_write'] // ReadOnly Access for Global Tenant
          }
        ]
      }
    };

    // If this group has no projects assigned, we create a fake project as OpendistroSecurity needs at least one indicies permission to work.
    if (groupProjectIDsArray.length === 0) {
      groupProjectPermissions.body.index_permissions[0].index_patterns.push(
        `${groupName}-has-no-project`
      );
    } else {
      // inject project permissions into permission array
      groupProjectNames.forEach(projectName =>
        groupProjectPermissions.body.index_permissions[0].index_patterns.push(
          `/^(application|container|lagoon|router)-logs-${projectName}-_-.+/`
        )
      );
    }

    try {
      // Create a new OpendistroSecurity Role for this Group with read permissions for all Projects assigned to this group
      await opendistroSecurityClient.put(
        `roles/${groupName}`,
        groupProjectPermissions
      );
      logger.debug(
        `${groupName}: Created OpendistroSecurity role "${groupName}"`
      );
    } catch (err) {
      logger.error(`OpendistroSecurity create role error: ${err}`);
    }

    if (tenantName != 'global_tenant') {
      try {
        // Create a new Tenant for this Group
        await opendistroSecurityClient.put(`tenants/${tenantName}`, { body: { description: `${tenantName}` } });
        logger.debug(`${groupName}: Created Tenant "${tenantName}"`);
      } catch (err) {
        logger.error(`Opendistro-Security create tenant error: ${err}`);
      };

      try {
        // Create a new RoleMapping for this Group
        await opendistroSecurityClient.put(`rolesmapping/${tenantName}`, { body: { backend_roles: [`${tenantName}`] } });
        logger.debug(`${groupName}: Created RoleMapping "${tenantName}"`);
      } catch (err) {
        logger.error(`Opendistro-Security create rolemapping error: ${err}`);
      }
    }

    // Create index-patterns for this group
    // @TODO Remove index-patterns that are not used anymore? like when a project is removed from the group?
    const indexPatterns = [];

    // Define the default fields for index patterns
    const applicationLogs =
      '[{"name":"@timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"@version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"application","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"application.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"channel","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"channel.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.ip","type":"ip","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.latitude","type":"number","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.location","type":"geo_point","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.longitude","type":"number","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"host.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"ip","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"ip.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"level","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"level.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"link","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"link.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"log-type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"log-type.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"message","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"openshift_project","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"openshift_project.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"request_uri","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request_uri.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"uid","type":"number","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]';
    const containerLogs =
      '[{"name":"@timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"@version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"geoip.ip","type":"ip","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.latitude","type":"number","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.location","type":"geo_point","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.longitude","type":"number","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.container_name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.container_name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.host.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.baasid","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.baasid.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.baasresource","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.baasresource.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.branch","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.branch.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.controller-uid","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.controller-uid.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.deployment","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.deployment.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.deploymentconfig","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.deploymentconfig.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.job-name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.job-name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.openshift_io/build_name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.openshift_io/build_name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.openshift_io/deployer-pod-for_name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.openshift_io/deployer-pod-for_name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.project","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.project.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.labels.service","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.labels.service.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.namespace_name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"kubernetes.pod_name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.pod_name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"level","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"level.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"message","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false}]';
    const routerLogs =
      '[{"name":"@timestamp","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","esTypes":["_id"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","esTypes":["_index"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","esTypes":["_source"],"count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","esTypes":["_type"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"bytes_sent","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"cluster","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"cluster.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"cluster"}}},{"name":"host","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"host.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"host"}}},{"name":"http_referer","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"http_referer.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"http_referer"}}},{"name":"http_user_agent","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"http_user_agent.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"http_user_agent"}}},{"name":"ingress_name","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"ingress_name.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"ingress_name"}}},{"name":"kubernetes.namespace_id","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_id.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_id"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/controller","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/controller.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/controller"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/environment","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/environment.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/environment"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/environmentAutoIdle","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/environmentAutoIdle.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/environmentAutoIdle"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/environmentId","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/environmentId.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/environmentId"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/environmentType","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/environmentType.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/environmentType"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/project","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/project.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/project"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/projectAutoIdle","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/projectAutoIdle.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/projectAutoIdle"}}},{"name":"kubernetes.namespace_labels.lagoon_sh/projectId","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_labels.lagoon_sh/projectId.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_labels.lagoon_sh/projectId"}}},{"name":"kubernetes.namespace_name","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"kubernetes.namespace_name.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"kubernetes.namespace_name"}}},{"name":"namespace","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"namespace.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"namespace"}}},{"name":"remote_addr","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"remote_addr.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"remote_addr"}}},{"name":"remote_user","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"remote_user.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"remote_user"}}},{"name":"req_id","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"req_id.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"req_id"}}},{"name":"request_length","type":"number","esTypes":["long"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"request_method","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request_method.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"request_method"}}},{"name":"request_proto","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request_proto.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"request_proto"}}},{"name":"request_query","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request_query.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"request_query"}}},{"name":"request_time","type":"number","esTypes":["float"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"request_uri","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"request_uri.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"request_uri"}}},{"name":"service_name","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"service_name.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"service_name"}}},{"name":"service_port","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"service_port.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"service_port"}}},{"name":"status","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"status.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"status"}}},{"name":"stream","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"stream.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"stream"}}},{"name":"time","type":"date","esTypes":["date"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"true-client-ip","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"true-client-ip.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"true-client-ip"}}},{"name":"x-forwarded-for","type":"string","esTypes":["text"],"count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"x-forwarded-for.keyword","type":"string","esTypes":["keyword"],"count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true,"subType":{"multi":{"parent":"x-forwarded-for"}}}]';
    const lagoonLogs =
      '[{"name":"@timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"@version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"event","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"event.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.ip","type":"ip","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.latitude","type":"number","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.location","type":"geo_point","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"geoip.longitude","type":"number","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"log-type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"log-type.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"message","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.branchName","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.branchName.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.buildName","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.buildName.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.buildPhase","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.buildPhase.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.environmentName","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.environmentName.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.fullEvent","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.fullEvent.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.logLink","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.logLink.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.openshiftProject","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.openshiftProject.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.projectName","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.projectName.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.remoteId","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.remoteId.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.route","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.route.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"meta.routes","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"meta.routes.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"project","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"project.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"severity","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"severity.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"uuid","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"uuid.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]';

    indexPatterns.push(
      ['application-logs-*', applicationLogs],
      ['router-logs-*', routerLogs],
      ['container-logs-*', containerLogs],
      ['lagoon-logs-*', lagoonLogs]
    );

    // if we are on the global_tenant, we don't create project specific index patterns as they could be seen by everybody
    // (everybody has access to the global tenant)
    if (tenantName != 'global_tenant') {
      groupProjectNames.forEach(projectName =>
        indexPatterns.push(
          [`application-logs-${projectName}-*`, applicationLogs],
          [`router-logs-${projectName}-*`, routerLogs],
          [`container-logs-${projectName}-*`, containerLogs],
          [`lagoon-logs-${projectName}-*`, lagoonLogs]
        )
      );
    }

    const kibanaTenantName = tenantName == 'global_tenant' ? 'global' : tenantName // global_tenant is `global` when working with the kibana api
    const queryParameter = overwriteKibanaIndexPattern == 'true' ? `?overwrite=true` : '';

    for (const indexPattern of indexPatterns) {
      try {
        await kibanaClient.post(
          `saved_objects/index-pattern/${indexPattern[0]}${queryParameter}`,
          {
            body: {
              attributes: {
                title: `${indexPattern[0]}`,
                timeFieldName: '@timestamp',
                fields: `${indexPattern[1]}`
              }
            },
            headers: {
              securitytenant: kibanaTenantName
            }
          }
        );
        logger.debug(
          `${groupName}: Created index-pattern "${indexPattern[0]}"`
        );
      } catch (err) {
        // 409 Errors are expected and mean that there is already an index-pattern with that name defined, we ignore them
        if (err.statusCode !== 409) {
          logger.error(
            `Kibana Error during setup of index pattern "${indexPattern[0]}": ${err}`
          );
          // Don't fail if we have Kibana Errors, as they are "non-critical"
        } else {
          logger.debug(
            `${groupName}: index-pattern "${indexPattern[0]}" already existing`
          );
        }
      }
    }

    try {
      const currentSettings = await kibanaClient.get('kibana/settings', {
        headers: {
          securitytenant: kibanaTenantName
        }
      });

      const defaultIndexPattern = 'container-logs-*';

      // Define a default Index if there is none yet
      if (!('defaultIndex' in currentSettings.body.settings)) {
        await kibanaClient.post('kibana/settings', {
          body: {
            changes: {
              defaultIndex: defaultIndexPattern,
              'telemetry:optIn': false // also opt out of telemetry from xpack
            }
          },
          headers: {
            securitytenant: kibanaTenantName
          }
        });
        logger.debug(
          `${groupName}: Configured default index for tenant "${tenantName}" to  "${defaultIndexPattern}"`
        );
      } else {
        logger.debug(
          `${groupName}: Configured default index for tenant "${tenantName}" was already set to "${currentSettings.body.settings.defaultIndex.userValue}"`
        );
      }
    } catch (err) {
      logger.error(`Kibana Error during config of default Index: ${err}`);
      // Don't fail if we have Kibana Errors, as they are "non-critical"
    }
  },
  deleteTenant: async tenantName => {
    try {
      // Delete the Tenant for this Group
      await opendistroSecurityClient.delete(`tenants/${tenantName}`);
      logger.debug(
        `${tenantName}: Deleted Opendistro-Security Tenant "${tenantName}"`
      );
    } catch (err) {
      // 404 Errors are expected and mean that the role does not exist
      if (err.statusCode !== 404) {
        logger.error(
          `Opendistro-Security Error during deletion of tenant "${tenantName}": ${err}`
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
      logger.debug(
        `${groupName}: OpendistroSecurity Role "${groupName}" deleted`
      );
    } catch (err) {
      // 404 Errors are expected and mean that the role does not exist
      if (err.statusCode !== 404) {
        logger.error(
          `OpendistroSecurity Error during deletion of role "${groupName}": ${err}`
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
