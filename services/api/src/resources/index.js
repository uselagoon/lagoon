// @flow

/* ::
import type MariaSQL from 'mariasql';
import type elasticsearch from 'elasticsearch';

export type Cred = {
  role: string,
  userId: number,
  permissions: {
    customers: Array<string>,
    projects: Array<string>
  }
};

export type CredMaybe = {
  role?: string,
  userId?: number,
  permissions: {
    customers?: Array<string>,
    projects?: Array<string>
  }
};

type hasPermissionFn = (resource: string, scope: mixed, attributes: object) => void;

type ResolverFn = (
  obj: {
    id: string,
    openshiftProjectName: string,
  },
  args: {
    input: any,
    id: string,
    name: string,
    createdAfter: string,
    gitUrl: string,
    month: string,
    sshKey: string,
  },
  context: {
    credentials: Cred,
    sqlClient: MariaSQL,
    hasPermission: hasPermissionFn,
  },
  info?: {|
    +fieldName: string,
    +fieldNodes: $ReadOnlyArray<any>,
    +returnType: any,
    +parentType: any,
    +path: any,
    +schema: any,
    +fragments: any,
    +rootValue: mixed,
    +operation: any,
    +variableValues: { [variable: string]: mixed },
  |},
) => any;

type SubscribeObj = {
  subscribe: () => mixed,
};

export type ResolversObj = {
  [string]: ResolverFn | SubscribeObj | string
};

type SqlFn = (...args: Array<any>) => string;

export type SqlObj = {
  [string]: SqlFn
};
*/
