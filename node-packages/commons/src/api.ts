import { Lokka } from 'lokka';
import { Transport } from './lokka-transport-http-retry';
import { replace, pipe, toLower } from 'ramda';
import { getConfigFromEnv } from './util/config';

import { DeploymentSourceType, DeployType, TaskStatusType, TaskSourceType } from './types';

export interface Project {
  autoIdle: number;
  availability: ProjectAvailability;
  branches: string;
  buildImage: string;
  created: string;
  deploymentsDisabled: number;
  // deployTargetConfigs: ;
  developmentBuildPriority: number;
  developmentEnvironmentsLimit: number;
  // environments: ;
  envVariables: EnvKeyValue[];
  factsUI: number;
  gitUrl: string;
  // groups: ;
  id: number;
  kubernetes: Kubernetes;
  kubernetesNamespacePattern: string;
  // metadata: ;
  name: string;
  // notifications: ;
  openshift: Kubernetes;
  openshiftProjectName: string;
  openshiftProjectPattern: string;
  organization: number;
  privateKey: string;
  problemsUI: string;
  productionAlias: string;
  productionBuildPriority: number;
  productionEnvironment: string;
  productionRoutes: string;
  publicKey: string;
  pullrequests: string;
  routerPattern: string;
  sharedBaasBucket: boolean;
  standbyAlias: string;
  standbyProductionEnvironment: string;
  standbyRoutes: string;
  storageCalc: number;
  subfolder: string;
}

export interface Kubernetes {
  buildImage: string;
  cloudProvider: string;
  cloudRegion: string;
  consoleUrl: string;
  created: string;
  disabled: boolean;
  friendlyName: string;
  id: number;
  monitoringConfig: any;
  name: string;
  routerPattern: string;
  sharedBaasBucketName: string;
  sshHost: string;
  sshPort: string;
  token: string;
}

export interface EnvKeyValue {
  id: number;
  name: string;
  scope: EnvVariableScope;
  value: string;
}

interface GroupPatch {
  name?: string;
}

interface UserPatch {
  email?: string;
  firstName?: string;
  lastName?: string;
  comment?: string;
  gitlabId?: number;
}

interface ProjectPatch {
  name?: string;
  gitUrl?: string;
  subfolder?: string;
  routerPattern?: string;
  branches?: string;
  productionenvironment?: string;
  autoidle?: number;
  storagecalc?: number;
  pullrequests?: string;
  openshift?: number;
  openshiftprojectpattern?: string;
  productionRoutes?: string;
  standbyRoutes?: string;
  productionEnvironment?: string;
  standbyProductionEnvironment?: string;
}

interface DeploymentPatch {
  name?: number;
  status?: string;
  created?: string;
  started?: string;
  completed?: string;
  environment?: number;
  remoteId?: string;
}

interface TaskPatch {
  name?: number;
  status?: string;
  created?: string;
  started?: string;
  completed?: string;
  environment?: number;
  remoteId?: string;
}

interface RestorePatch {
  status?: string;
  created?: string;
  restoreLocation?: string;
}

enum EnvType {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development'
}

enum ProjectAvailability {
  STANDARD = 'STANDARD',
  HIGH = 'HIGH',
  POLYSITE = 'POLYSITE'
}

export enum EnvVariableScope {
  BUILD = 'build',
  RUNTIME = 'runtime',
  GLOBAL = 'global',
  CONTAINER_REGISTRY = 'container_registry',
  INTERNAL_CONTAINER_REGISTRY = 'internal_container_registry'
}

let transportOptions: {
  headers: {
    Authorization?: string
  },
  timeout: number
} = {
  headers: {},
  timeout: 60000
};

const transport = new Transport(`${getConfigFromEnv('API_HOST', 'http://api:3000')}/graphql`, {transportOptions});

export const graphqlapi = new Lokka({ transport });
export const lagoonApi = graphqlapi;

export class ProjectNotFound extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ProjectNotFound';
  }
}

class OrganizationNotFound extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'OrganizationNotFound';
  }
}

class EnvironmentNotFound extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'EnvironmentNotFound';
  }
}

const sshKeyFragment = graphqlapi.createFragment(`
fragment on SshKey {
  id
  name
  keyValue
  keyType
}
`);

const userFragment = graphqlapi.createFragment(`
fragment on User {
  id
  email
  firstName
  lastName
  gitlabId
  sshKeys {
    id
    name
  }
}
`);

const groupFragment = graphqlapi.createFragment(`
fragment on Group {
  id
  name
}
`);

const projectFragment = graphqlapi.createFragment(`
fragment on Project {
  id
  name
  gitUrl
  privateKey
  problemsUi
}
`);

const backupFragment = graphqlapi.createFragment(`
fragment on Backup {
  id
  environment {
    id
  }
  backupId
  source
  created
}
`);

export const addGroup = (name: string): Promise<any> =>
  graphqlapi.mutate(
    `
  ($name: String!) {
    addGroup(input: {
        name: $name
    }) {
      ...${groupFragment}
    }
  }
`,
    {
      name
    }
  );

export const addGroupWithParent = (
  name: string,
  parentGroupName: string
): Promise<any> =>
  graphqlapi.mutate(
    `
    ($name: String!, $parentGroupName: String) {
      addGroup(input: {
          name: $name
          parentGroup: { name: $parentGroupName }
      }) {
        ...${groupFragment}
      }
    }
  `,
    {
      name,
      parentGroupName
    }
  );

export const addBackup = (
  id: number | null = null,
  environment: number,
  source: string,
  backupId: string,
  created: string
): Promise<any> =>
  graphqlapi.mutate(
    `
    ($id: Int, $environment: Int!, $source: String!, $backupId: String!, $created: String!) {
      addBackup(input: {
          id: $id
          environment: $environment
          source: $source
          backupId: $backupId
          created: $created
      }) {
        ...${backupFragment}
      }
    }
  `,
    {
      id,
      environment,
      source,
      backupId,
      created
    }
  );

export const deleteBackup = (backupId: string): Promise<any> =>
  graphqlapi.mutate(
    `
  ($backupId: String!) {
    deleteBackup(input: {
      backupId: $backupId
    })
  }
  `,
    { backupId }
  );

const restoreFragment = graphqlapi.createFragment(`
  fragment on Restore {
    id
    status
    created
    restoreLocation
    backupId
  }
  `);

export const updateRestore = (
  backupId: string,
  patch: RestorePatch
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($backupId: String!, $patch: UpdateRestorePatchInput!) {
    updateRestore(input: {
      backupId: $backupId
      patch: $patch
    }) {
      ...${restoreFragment}
    }
  }
`,
    { backupId, patch }
  );

export const getEnvironmentBackups = (
  openshiftProjectName: string
): Promise<any[]> =>
  graphqlapi.query(
    `
  query environmentByOpenshiftProjectName($openshiftProjectName: String!) {
    environmentByOpenshiftProjectName(openshiftProjectName: $openshiftProjectName) {
      id
      name
      openshiftProjectName
      project {
        name
      }
      backups {
        id
        backupId
        source
        created
      }
    }
  }
`,
    { openshiftProjectName }
  );

export const updateGroup = (name: string, patch: GroupPatch): Promise<any> =>
  graphqlapi.mutate(
    `
  ($name: String!, $patch: UpdateGroupPatchInput!) {
    updateGroup(input: {
      group: {
        name: $name
      }
      patch: $patch
    }) {
      ...${groupFragment}
    }
  }
  `,
    { name, patch }
  );

export const deleteGroup = (name: string): Promise<any> =>
  graphqlapi.mutate(
    `
  ($name: String!) {
    deleteGroup(input: {
      group: {
        name: $name
      }
    })
  }
  `,
    { name }
  );

export const getUserBySshKey = (sshKey: string): Promise<any> =>
  graphqlapi.query(
    `
  query userBySshKey($sshKey: String!) {
    userBySshKey(sshKey: $sshKey) {
      ...${userFragment}
    }
  }
`,
    { sshKey }
  );

export const addUser = (
  email: string,
  firstName: string | null = null,
  lastName: string | null = null,
  comment: string | null = null,
  gitlabId: number | null = null
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($email: String!, $firstName: String, $lastName: String, $comment: String, $gitlabId: Int) {
    addUser(input: {
      email: $email
      firstName: $firstName
      lastName: $lastName
      comment: $comment
      gitlabId: $gitlabId
    }) {
      ...${userFragment}
    }
  }
`,
    {
      email,
      firstName,
      lastName,
      comment,
      gitlabId
    }
  );

export const updateUser = (email: string, patch: UserPatch): Promise<any> =>
  graphqlapi.mutate(
    `
  ($email: String!, $patch: UpdateUserPatchInput!) {
    updateUser(input: {
      user: {
        email: $email
      }
      patch: $patch
    }) {
      ...${userFragment}
    }
  }
  `,
    { email, patch }
  );

export const deleteUser = (email: string): Promise<any> =>
  graphqlapi.mutate(
    `
  ($email: String!) {
    deleteUser(input: {
      user: {
        email: $email
      }
    })
  }
  `,
    { email }
  );

export const addUserToGroup = (
  userEmail: string,
  groupName: string,
  role: string
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($userEmail: String!, $groupName: String!, $role: GroupRole!) {
    addUserToGroup(input: {
      user: { email: $userEmail }
      group: { name: $groupName }
      role: $role
    }) {
      ...${groupFragment}
    }
  }
  `,
    { userEmail, groupName, role }
  );

export const addGroupToProject = (
  project: string,
  group: string
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($project: String!, $group: String!) {
    addGroupsToProject(input: {
      project: { name: $project}
      groups: [{name: $group}]
    }) {
      ...${projectFragment}
    }
  }
  `,
    { project, group }
  );

export const removeGroupFromProject = (
  project: string,
  group: string
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($project: String!, $group: String!) {
    removeGroupsFromProject(input: {
      project: { name: $project}
      groups: [{name: $group}]
    }) {
      ...${projectFragment}
    }
  }
  `,
    { project, group }
  );

export const removeUserFromGroup = (
  userEmail: string,
  groupName: string
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($userEmail: String!, $groupName: String!) {
    removeUserFromGroup(input: {
      user: { email: $userEmail }
      group: { name: $groupName }
    }) {
      ...${groupFragment}
    }
  }
  `,
    { userEmail, groupName }
  );

export const addSshKey = (
  id: number | null = null,
  name: string,
  keyValue: string,
  keyType: string,
  userEmail: string
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($id: Int, $name: String!, $keyValue: String!, $keyType: SshKeyType!, $userEmail: String!) {
    addSshKey(input: {
      id: $id
      name: $name
      keyValue: $keyValue
      keyType: $keyType
      user: {
        email: $userEmail
      }
    }) {
      ...${sshKeyFragment}
    }
  }
  `,
    {
      id,
      name,
      keyValue,
      userEmail,
      keyType
    }
  );

export const deleteSshKey = (name: string): Promise<any> =>
  graphqlapi.mutate(
    `
    ($name: String!) {
      deleteSshKey(input: {
        name: $name
      })
    }
    `,
    {
      name,
    },
  );

export const addProject = (
  name: string,
  gitUrl: string,
  openshift: number,
  productionenvironment: string,
  id: number | null = null
): Promise<any> =>
  graphqlapi.mutate(
    `
    ($name: String!, $gitUrl: String!, $openshift: Int!, $productionenvironment: String!, $id: Int) {
      addProject(input: {
        name: $name,
        gitUrl: $gitUrl,
        openshift: $openshift,
        productionEnvironment: $productionenvironment,
        id: $id,
      }) {
        ...${projectFragment}
      }
    }
  `,
    {
      name,
      gitUrl,
      openshift,
      productionenvironment,
      id
    }
  );

export const updateProject = (
  id: number,
  patch: ProjectPatch
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($id: Int!, $patch: UpdateProjectPatchInput!) {
    updateProject(input: {
      id: $id
      patch: $patch
    }) {
      ...${projectFragment}
    }
  }
  `,
    { id, patch }
  );

export const deleteProject = (name: string): Promise<any> =>
  graphqlapi.mutate(
    `
  ($name: String!) {
    deleteProject(input: {
      project: $name
    })
  }
  `,
    { name }
  );

export async function getProjectByName(project: string): Promise<any> {
  const result = await graphqlapi.query(`
    {
      project:projectByName(name: "${project}") {
        ...${projectFragment}
      }
    }
  `);

  if (!result || !result.project) {
    throw new ProjectNotFound(`Cannot find project ${project}`);
  }

  return result.project;
}

export const allProjectsInGroup = (groupInput: {
  id?: string;
  name?: string;
}): Promise<any[]> =>
  graphqlapi.query(
    `
    query($groupInput: GroupInput!) {
      allProjectsInGroup(input: $groupInput) {
        ...${projectFragment}
      }
    }
  `,
    {
      groupInput
    }
  );

export async function getEnvironmentByName(
  name: string,
  projectId: number,
  includeDeleted: boolean = true
): Promise<any> {
  const result = await graphqlapi.query(`
    {
      environmentByName(name: "${name}", project:${projectId}, includeDeleted:${includeDeleted}) {
        id,
        name,
        route,
        routes,
        deployType,
        autoIdle,
        environmentType,
        openshiftProjectName,
        updated,
        created,
        deleted,
      }
    }
  `);

  if (!result || !result.environmentByName) {
    throw new EnvironmentNotFound(
      `Cannot find environment for projectId ${projectId}, name ${name}\n${result.environmentByName}`
    );
  }

  return result;
}

export async function getEnvironmentByIdWithVariables(
  id: number
): Promise<any> {
  const result = await graphqlapi.query(`
    {
      environmentById(id: ${id}) {
        id
        name
        autoIdle
        deployType
        environmentType
        openshiftProjectName
        openshiftProjectPattern
        openshift {
          ...${deployTargetMinimalFragment}
        }
        envVariables {
          name
          value
          scope
        }
      }
    }
  `);

  if (!result || !result.environmentById) {
    throw new EnvironmentNotFound(
      `Cannot find environment for id ${id}\n${result.environmentById}`
    );
  }

  return result;
}

export async function getEnvironmentByOpenshiftProjectName(
  openshiftProjectName: string
): Promise<any[]> {
  const result = await graphqlapi.query(`
    {
      environmentByOpenshiftProjectName(openshiftProjectName: "${openshiftProjectName}") {
        id,
        name,
        project {
          name
        }
      }
    }
  `);

  if (!result || !result.environmentByOpenshiftProjectName) {
    throw new EnvironmentNotFound(
      `Cannot find environment for OpenshiftProjectName ${openshiftProjectName}\n${result.environmentByOpenshiftProjectName}`
    );
  }

  return result;
}

export const addOrUpdateEnvironment = (
  name: string,
  projectId: number,
  deployType: DeployType,
  deployBaseRef: string,
  environmentType: string,
  openshiftProjectName: string,
  openshift: number,
  openshiftProjectPattern: string,
  deployHeadRef: string | null = null,
  deployTitle: string | null = null
): Promise<any> =>
  graphqlapi.mutate(
    `
($name: String!, $project: Int!, $openshift: Int, $openshiftProjectPattern: String, $deployType: DeployType!, $deployBaseRef: String!, $deployHeadRef: String, $deployTitle: String, $environmentType: EnvType!, $openshiftProjectName: String!) {
  addOrUpdateEnvironment(input: {
    name: $name,
    project: $project,
    openshift: $openshift,
    deployType: $deployType,
    deployBaseRef: $deployBaseRef,
    deployHeadRef: $deployHeadRef,
    deployTitle: $deployTitle,
    environmentType: $environmentType,
    openshiftProjectName: $openshiftProjectName
    openshiftProjectPattern: $openshiftProjectPattern
  }) {
    id
    name
    project {
      name
    }
    autoIdle
    deployType
    environmentType
    openshiftProjectName
    openshiftProjectPattern
    envVariables {
      name
      value
      scope
    }
  }
}
`,
    {
      name,
      project: projectId,
      deployType: deployType.toUpperCase(),
      deployBaseRef,
      deployHeadRef,
      deployTitle,
      environmentType,
      openshiftProjectName,
      openshift,
      openshiftProjectPattern
    }
  );

interface GetOpenshiftInfoForProjectResult {
  project: Pick<
    Project,
    | 'autoIdle'
    | 'availability'
    | 'branches'
    | 'buildImage'
    | 'developmentBuildPriority'
    | 'gitUrl'
    | 'id'
    | 'openshiftProjectPattern'
    | 'organization'
    | 'privateKey'
    | 'productionAlias'
    | 'productionBuildPriority'
    | 'productionEnvironment'
    | 'productionRoutes'
    | 'pullrequests'
    | 'routerPattern'
    | 'sharedBaasBucket'
    | 'standbyAlias'
    | 'standbyProductionEnvironment'
    | 'standbyRoutes'
    | 'storageCalc'
    | 'subfolder'
  > & {
    openshift: Pick<Kubernetes, keyof DeployTargetMinimalFragment>;
    envVariables: Pick<EnvKeyValue, 'name' | 'scope' | 'value'>[];
  };
}

export const getOpenShiftInfoForProject = (project: string): Promise<GetOpenshiftInfoForProjectResult> =>
  graphqlapi.query(`
    {
      project:projectByName(name: "${project}"){
        autoIdle
        availability
        branches
        buildImage
        developmentBuildPriority
        envVariables {
          name
          scope
          value
        }
        gitUrl
        id
        openshift  {
          ...${deployTargetMinimalFragment}
        }
        openshiftProjectPattern
        organization
        privateKey
        productionAlias
        productionBuildPriority
        productionEnvironment
        productionRoutes
        pullrequests
        routerPattern
        sharedBaasBucket
        standbyAlias
        standbyProductionEnvironment
        standbyRoutes
        storageCalc
        subfolder
      }
    }
`);

export const getDeployTargetConfigsForProject = (project: number): Promise<any> =>
  graphqlapi.query(`
    {
      targets:deployTargetConfigsByProjectId(project: ${project}){
        id
        weight
        branches
        pullrequests
        weight
        deployTargetProjectPattern
        deployTarget{
          ...${deployTargetMinimalFragment}
        }
      }
    }
`);

interface GetOpenShiftInfoForEnvironmentEnvironmentResult {
  id: number
  name: string
  openshiftProjectPattern: string
  openshift: DeployTargetMinimalFragment
  project: Pick<Project, 'sharedBaasBucket' | 'buildImage'> & {
    envVariables: Pick<EnvKeyValue, 'name' | 'scope' | 'value'>[]
  }
}

export interface GetOpenShiftInfoForEnvironmentResult {
  environment: GetOpenShiftInfoForEnvironmentEnvironmentResult
}

export const getOpenShiftInfoForEnvironment = (environment: number): Promise<GetOpenShiftInfoForEnvironmentResult> =>
  graphqlapi.query(`
    {
      environment:environmentById(id: ${environment}){
        id
        name
        openshiftProjectPattern
        openshift  {
          ...${deployTargetMinimalFragment}
        }
        project {
          sharedBaasBucket
          buildImage
          envVariables {
            name
            value
            scope
          }
        }
      }
    }
`);

interface GetEnvironentsForProjectEnvironmentResult {
  name: string;
  id: number;
  environmentType: EnvType;
  openshiftProjectPattern: string;
  openshift: any;
}

interface GetEnvironentsForProjectProjectResult {
  id: number;
  developmentEnvironmentsLimit: number;
  productionEnvironment: string;
  standbyProductionEnvironment: string;
  environments: GetEnvironentsForProjectEnvironmentResult[];
}

interface GetEnvironentsForProjectResult {
  project: GetEnvironentsForProjectProjectResult
}

export const getEnvironmentsForProject = (
  project: string
): Promise<GetEnvironentsForProjectResult> =>
  graphqlapi.query(`
  {
    project:projectByName(name: "${project}"){
      id
      developmentEnvironmentsLimit
      productionEnvironment
      standbyProductionEnvironment
      environments(includeDeleted:false) {
        name
        id
        environmentType
        autoIdle
        openshiftProjectPattern
        openshift{
          ...${deployTargetMinimalFragment}
        }
      }
    }
  }
`);

export async function getOrganizationByIdWithEnvs(id: number): Promise<any> {
  const result = await graphqlapi.query(`
    {
      organization:organizationById(id: ${id}) {
        id
        name
        friendlyName
        description
        quotaProject
        quotaEnvironment
        quotaGroup
        quotaNotification
        quotaRoute
        environments {
          name
          id
          environmentType
          autoIdle
          openshift{
            ...${deployTargetMinimalFragment}
          }
        }
      }
    }
  `);

  if (!result || !result.organization) {
    throw new OrganizationNotFound(`Cannot find organization ${id}`);
  }

  return result.organization;
}

export async function getOrganizationById(id: number): Promise<any> {
  const result = await graphqlapi.query(`
    {
      organization:organizationById(id: ${id}) {
        id
        name
        friendlyName
        description
        quotaProject
        quotaEnvironment
        quotaGroup
        quotaRoute
        quotaNotification
        envVariables {
          name
          value
          scope
        }
      }
    }
  `);

  if (!result || !result.organization) {
    throw new OrganizationNotFound(`Cannot find organization ${id}`);
  }

  return result.organization;
}

const deploymentFragment = graphqlapi.createFragment(`
fragment on Deployment {
  id
  name
  status
  created
  started
  completed
  remoteId
  uiLink
  environment {
    name
  }
}
`);

type DeployTargetMinimalFragment = Pick<
  Kubernetes,
  | 'id'
  | 'name'
  | 'routerPattern'
  | 'buildImage'
  | 'disabled'
  | 'sharedBaasBucketName'
  | 'monitoringConfig'
>;

const deployTargetMinimalFragment = graphqlapi.createFragment(`
fragment on Openshift {
  id
  name
  routerPattern
  buildImage
  disabled
  sharedBaasBucketName
  monitoringConfig
}
`);

export const addDeployment = (
  name: string,
  status: string,
  created: string,
  environment: number,
  remoteId: string | null = null,
  id: number | null = null,
  started: string | null = null,
  completed: string | null = null,
  priority: number,
  bulkId: string | null = null,
  bulkName: string | null = null,
  sourceUser: string | null = null,
  sourceType: DeploymentSourceType,
): Promise<any> =>
  graphqlapi.mutate(
    `
  ($name: String!, $status: DeploymentStatusType!, $created: String!, $environment: Int!, $id: Int, $remoteId: String,
    $started: String, $completed: String, $priority: Int, $bulkId: String, $bulkName: String,
    $sourceUser: String, $sourceType: DeploymentSourceType) {
    addDeployment(input: {
        name: $name
        status: $status
        created: $created
        environment: $environment
        id: $id
        remoteId: $remoteId
        started: $started
        completed: $completed
        priority: $priority
        bulkId: $bulkId
        bulkName: $bulkName
        sourceUser: $sourceUser
        sourceType: $sourceType
    }) {
      ...${deploymentFragment}
    }
  }
`,
    {
      name,
      status,
      created,
      environment,
      id,
      remoteId,
      started,
      completed,
      priority,
      bulkId,
      bulkName,
      sourceUser,
      sourceType: sourceType.toUpperCase(),
    }
  );

export const addTask = (
  name: string,
  status: TaskStatusType,
  created: string,
  environment: number,
  remoteId = null,
  id: number | null = null,
  started: string | null = null,
  completed: string | null = null,
  service: string | null = null,
  command: string | null = null,
  execute: boolean = false,
  sourceUser: string | null = null,
  sourceType: TaskSourceType,
) =>
  graphqlapi.mutate(
    `
  ($name: String!, $status: TaskStatusType!, $created: String!, $environment: Int!, $id: Int, $remoteId: String,
    $started: String, $completed: String, $service: String, $command: String, $execute: Boolean,
    $sourceUser: String, $sourceType: TaskSourceType) {
    addTask(input: {
        name: $name
        status: $status
        created: $created
        environment: $environment
        id: $id
        remoteId: $remoteId
        started: $started
        completed: $completed
        service: $service
        command: $command
        execute: $execute
        sourceUser: $sourceUser
        sourceType: $sourceType
    }) {
      ...${taskFragment}
    }
  }
`,
    {
      name,
      status: status.toUpperCase(),
      created,
      environment,
      id,
      remoteId,
      started,
      completed,
      service,
      command,
      execute,
      sourceUser,
      sourceType: sourceType.toUpperCase(),
    },
  );

const taskFragment = graphqlapi.createFragment(`
fragment on Task {
  id
  name
  status
  created
  started
  completed
  remoteId
  environment {
    name
  }
}
`);

export const sanitizeGroupName = pipe(
  replace(/[^a-zA-Z0-9-]/g, '-'),
  toLower
);
export const sanitizeProjectName = pipe(
  replace(/[^a-zA-Z0-9-]/g, '-'),
  toLower
);

export const getProjectsByGroupName = (groupName: string) =>
  graphqlapi.query(
    `query groupByName($name: String!) {
    groupByName(name: $name) {
      id
      name
      projects {
        id
        name
        gitUrl
      }
    }
  }`,
    { name: groupName }
  );

export const getGroupMembersByGroupName = (groupName: string) =>
  graphqlapi.query(
    `query groupByName($name: String!) {
    groupByName(name: $name) {
      id
      name
      members {
        user {
          id
          email
        }
        role
      }
    }
  }`,
  { name: groupName }
);

interface AddProblemInput {
  environment: number,
  identifier: string,
  severity: string,
  source: string,
  data: string,
  id?: number,
  severityScore?: number,
  service?: string,
  associatedPackage?: string,
  description?: string,
  version?: string,
  fixedVersion?: string,
  links?: string
}

export const addProblem = ({
  id,
  environment,
  identifier,
  severity,
  source,
  severityScore,
  data,
  service,
  associatedPackage,
  description,
  version,
  fixedVersion,
  links
}: AddProblemInput) => {
  return graphqlapi.mutate(
  `($id: Int,
    $environment: Int!,
    $identifier: String!,
    $severity: ProblemSeverityRating!,
    $source: String!,
    $severityScore: SeverityScore,
    $data: String!,
    $service: String,
    $associatedPackage: String,
    $description: String,
    $version: String,
    $fixedVersion: String,
    $links: String) {
    addProblem(input: {
      id: $id
      environment: $environment
      identifier: $identifier
      severity: $severity
      source: $source
      severityScore: $severityScore
      data: $data
      service: $service
      associatedPackage: $associatedPackage
      description: $description
      version: $version
      fixedVersion: $fixedVersion
      links: $links
    }) {
      id
      environment {
        id
      }
      identifier
      severity
      source
      severityScore
      data
      associatedPackage
      description
      version
      fixedVersion
      links
    }
  }`,
  {
    id,
    environment,
    identifier,
    severity,
    source,
    severityScore,
    data,
    service,
    associatedPackage,
    description,
    version,
    fixedVersion,
    links
  },
)};

export const deleteProblemsFromSource = (
  environment: number,
  source: string,
  service: string
) => {
  return graphqlapi.mutate(
    `($environment: Int!, $source: String!, $service: String!) {
      deleteProblemsFromSource(input: {environment: $environment, source: $source, service: $service })
    }
    `,
    {
      environment,
      source,
      service
    }
  )};

const problemFragment = graphqlapi.createFragment(`
fragment on Problem {
  id
  severity
  severityScore
  identifier
  service
  source
  associatedPackage
  description
  links
  version
  fixedVersion
  data
  created
  deleted
}
`);

export const getProblemsforProjectEnvironment = async (
  environmentName: string,
  project: number
) => {
  const response = await graphqlapi.query(
    `query getProject($environmentName: String!, $project: Int!) {
      environmentByName(name: $environmentName, project: $project) {
        id
        name
        problems {
          ...${problemFragment}
        }
      }
    }`
  ,
  {
    environmentName,
    project
  });
  return response.environmentByName.problems;
};
