import * as R from 'ramda';
import { OpenSearchPayload, ProjectTuple, generateOpenSearchPayload } from '.';
import { isGlobalTenant } from './tenants';

/**
 * Payload structure for creating a role
 */
interface OpenSearchRolePayload extends OpenSearchPayload {
  body: {
    cluster_permissions: ['cluster:admin/opendistro/reports/menu/download'];
    index_permissions: [
      {
        index_patterns: string[];
        allowed_actions: ['read', 'indices:monitor/settings/get'];
      }
    ];
    tenant_permissions: TenantPermission[];
  };
}

interface TenantPermission {
  tenant_patterns: [string];
  allowed_actions: [string];
}

const blankOpenSearchRole = {
  cluster_permissions: ['cluster:admin/opendistro/reports/menu/download'],
  index_permissions: [
    {
      index_patterns: [],
      allowed_actions: ['read', 'indices:monitor/settings/get']
    }
  ],
  tenant_permissions: []
};

const setTentantPermissions = (permissions: TenantPermission[]) =>
  R.set(R.lensPath(['tenant_permissions']), permissions);
const setIndexPatterns = (patterns: string[]) =>
  R.set(R.lensPath(['index_permissions', 0, 'index_patterns']), patterns);

export const generateTenantPermissions = (
  tenantName: string
): TenantPermission[] =>
  R.ifElse(
    isGlobalTenant,
    R.always([
      {
        tenant_patterns: [tenantName],
        allowed_actions: ['kibana_all_read']
      }
    ]),
    R.always([
      {
        tenant_patterns: [tenantName],
        allowed_actions: ['kibana_all_write']
      }
    ])
  )(tenantName) as TenantPermission[];

export const generateIndexPermissionsPatterns = (
  groupName: string,
  projects: ProjectTuple[]
): string[] =>
  R.pipe(
    R.map(
      ([_, projectName]: ProjectTuple): string =>
        `/^(application|container|lagoon|router)-logs-${projectName}-_-.+/`
    ),
    R.when(R.isEmpty, R.always([`${groupName}-has-no-project`]))
    // @ts-ignore
  )(projects) as string[];

export const generateOpenSearchRolePayload = (
  tenantName: string,
  groupName: string,
  projects: ProjectTuple[]
) => <OpenSearchRolePayload>generateOpenSearchPayload(
    R.pipe(
      setTentantPermissions(generateTenantPermissions(tenantName)),
      setIndexPatterns(generateIndexPermissionsPatterns(groupName, projects))
    )(blankOpenSearchRole)
  );
