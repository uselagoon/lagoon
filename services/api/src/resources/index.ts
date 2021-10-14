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
      userActivityLogger: any | null,
      models: {
        UserModel,
        GroupModel
        BillingModel,
        ProjectModel,
        EnvironmentModel,
      },
    },
    info?
  ): any;
}
