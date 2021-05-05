import { MariaClient } from 'mariasql';
import { Pool } from 'mariadb';

interface hasPermission {
  (resource: string, scope: any, attributes?: any): Promise<void>;
}

export interface ResolverFn {
  (
    parent,
    args,
    context: {
      sqlClient: MariaClient,
      sqlClientPool: Pool,
      hasPermission: hasPermission,
      keycloakGrant: any | null,
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
