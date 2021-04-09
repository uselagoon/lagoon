import { MariaClient } from 'mariasql';

interface hasPermission {
  (resource: string, scope: any, attributes?: any): Promise<void>;
}

export interface ResolverFn {
  (
    parent,
    args,
    context: {
      sqlClient: MariaClient,
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
