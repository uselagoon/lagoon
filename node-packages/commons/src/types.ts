/* The scope `internal_system` isn't a valid scope in the API. Env vars with
 * this scope can't be set by end users.
 * New features can use this scope to pass data to lagoon builds as a "hack."
 */
export enum InternalEnvVariableScope {
  INTERNAL_SYSTEM = 'internal_system',
}

export enum DeployType {
  BRANCH = 'branch',
  PULLREQUEST = 'pullrequest',
  PROMOTE = 'promote'
}

export enum DeploymentSourceType {
  API = 'api',
  WEBHOOK = 'webhook'
}

export enum TaskStatusType {
  NEW = 'new',
  PENDING = 'pending',
  RUNNING = 'running',
  CANCELLED = 'cancelled',
  ERROR = 'error',
  FAILED = 'failed',
  COMPLETE = 'complete',
  QUEUED = 'queued',
  ACTIVE = 'active',
  SUCCEEDED = 'succeeded',
}

export enum TaskSourceType {
  API = 'api'
}

export enum AuditSourceType {
  API = 'api',
  CLI = 'cli',
  UI = 'ui'
}

export enum AuditType {
  BACKUP = 'backup',
  BULKDEPLOYMENT = 'bulkdeployment',
  DEPLOYMENT = 'deployment',
  DEPLOYTARGET = 'deploytarget',
  DEPLOYTARGETCONFIG = 'deploytargetconfig',
  ENVIRONMENT = 'environment',
  GROUP = 'group',
  NOTIFICATION = 'notification',
  ORGANIZATION = 'organization',
  PROJECT = 'project',
  SSHKEY = 'sshkey',
  TASK = 'task',
  USER = 'user',
  VARIABLE = 'variable',
  FILE = 'file',
}

export interface DeployData {
  baseBranchName?: string,
  baseSha?: string,
  branchName: string,
  buildName: string,
  buildPriority?: number,
  buildVariables?: Array<{name: string, value: string}>,
  bulkId?: string,
  bulkName?: string,
  headBranchName?: string,
  headSha?: string,
  projectName: string,
  promoteSourceEnvironment?: string,
  pullrequestNumber?: number,
  pullrequestTitle?: string,
  pullrequestUrl?: string,
  repoName?: string,
  repoUrl?: string,
  sha?: string,
  sourceType: DeploymentSourceType,
  sourceUser?: string,
  type: DeployType;
}

export interface RemoveData {
  branch?: string;
  branchName?: string;
  forceDeleteProductionEnvironment?: boolean;
  openshiftProjectName?: string;
  projectName: string;
  pullrequest?: string;
  pullrequestNumber?: number;
  pullrequestTitle?: string;
  type: DeployType;
}
