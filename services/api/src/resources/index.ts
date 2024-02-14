import { Pool } from 'mariadb';

interface hasPermission {
  (resource: string, scope: any, attributes?: any): Promise<void>;
}

export interface ResolverFn {
  (
    parent,
    args,
    context: {
      sqlClientPool: Pool,
      hasPermission: hasPermission,
      keycloakGrant: any | null,
      legacyGrant: any | null,
      userActivityLogger: any | null,
      models: {
        UserModel,
        GroupModel,
        ProjectModel,
        EnvironmentModel,
      },
      keycloakUsersGroups?: any | null,
      adminScopes?: any | null,
    },
    info?
  ): any;
}
