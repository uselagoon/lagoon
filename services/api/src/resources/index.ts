import { Pool } from 'mariadb';
import type { UserModel } from '../models/user';
import type { GroupModel } from '../models/group';
import type { EnvironmentModel } from '../models/environment';

interface hasPermission {
  (resource: string, scope: any, attributes?: any): Promise<void>;
}

export interface ResolverFn {
  (
    parent,
    args,
    context: {
      sqlClientPool: Pool;
      hasPermission: hasPermission;
      keycloakGrant: any | null;
      legacyGrant: any | null;
      userActivityLogger: any | null;
      models: {
        UserModel: UserModel;
        GroupModel: GroupModel;
        EnvironmentModel: EnvironmentModel;
      };
      keycloakUsersGroups?: any | null;
      adminScopes?: any | null;
    },
    info?,
  ): any;
}
