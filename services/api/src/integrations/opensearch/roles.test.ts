import {
  generateTenantPermissions,
  generateIndexPermissionsPatterns,
  generateOpenSearchRolePayload
} from './roles';

describe('generateTenantPermissions', () => {
  test('global tenant', () => {
    expect(generateTenantPermissions('global_tenant')).toStrictEqual([
      {
        tenant_patterns: ['global_tenant'],
        allowed_actions: ['kibana_all_read']
      }
    ]);
  });

  test('not global tenant', () => {
    expect(generateTenantPermissions('tenant-name')).toStrictEqual([
      {
        tenant_patterns: ['tenant-name'],
        allowed_actions: ['kibana_all_write']
      }
    ]);
  });
});

describe('generateIndexPermissionsPatterns', () => {
  test('with projects', () => {
    expect(
      generateIndexPermissionsPatterns('group-name', [[1, 'project-name']])
    ).toStrictEqual([
      `/^(application|container|lagoon|router)-logs-project-name-_-.+/`
    ]);
  });

  test('empty projects', () => {
    expect(generateIndexPermissionsPatterns('group-name', [])).toStrictEqual([
      'group-name-has-no-project'
    ]);
  });
});

describe('generateOpenSearchRolePayload', () => {
  test('group has no projects', () => {
    expect(
      generateOpenSearchRolePayload(
        'group-no-projects',
        'group-no-projects',
        []
      )
    ).toStrictEqual({
      body: {
        cluster_permissions: ['cluster:admin/opendistro/reports/menu/download'],
        index_permissions: [
          {
            index_patterns: ['group-no-projects-has-no-project'],
            allowed_actions: ['read', 'indices:monitor/settings/get']
          }
        ],
        tenant_permissions: [
          {
            tenant_patterns: ['group-no-projects'],
            allowed_actions: ['kibana_all_write']
          }
        ]
      }
    });
  });

  test('group with projects', () => {
    expect(
      generateOpenSearchRolePayload(
        'group-with-projects',
        'group-with-projects',
        [[1, 'project-a'], [1, 'project-b']]
      )
    ).toStrictEqual({
      body: {
        cluster_permissions: ['cluster:admin/opendistro/reports/menu/download'],
        index_permissions: [
          {
            index_patterns: [
              '/^(application|container|lagoon|router)-logs-project-a-_-.+/',
              '/^(application|container|lagoon|router)-logs-project-b-_-.+/'
            ],
            allowed_actions: ['read', 'indices:monitor/settings/get']
          }
        ],
        tenant_permissions: [
          {
            tenant_patterns: ['group-with-projects'],
            allowed_actions: ['kibana_all_write']
          }
        ]
      }
    });
  });

  test('global tenant', () => {
    expect(
      generateOpenSearchRolePayload('global_tenant', 'project-project-a', [
        [1, 'project-a']
      ])
    ).toStrictEqual({
      body: {
        cluster_permissions: ['cluster:admin/opendistro/reports/menu/download'],
        index_permissions: [
          {
            index_patterns: [
              '/^(application|container|lagoon|router)-logs-project-a-_-.+/'
            ],
            allowed_actions: ['read', 'indices:monitor/settings/get']
          }
        ],
        tenant_permissions: [
          {
            tenant_patterns: ['global_tenant'],
            allowed_actions: ['kibana_all_read']
          }
        ]
      }
    });
  });
});
