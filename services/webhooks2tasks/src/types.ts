/**
 * Webhook related types for incoming Events
 */

export interface removeData {
  projectName: string,
  pullrequestNumber?: number,
  pullrequestTitle?: string,
  openshiftProjectName?: string,
  forceDeleteProductionEnvironment?: boolean,
  branchName?: string,
  branch?: string,
  pullrequest?: string,
  type: string
};

export interface deployData {
  projectName: string,
  branchName: string,
  sha?: string,
  repoUrl?: string,
  repoName?: string,
  pullrequestTitle?: string,
  pullrequestNumber?: number,
  pullrequestUrl?: string,
  type?: string,
  headBranchName?: string,
  headSha?: string,
  baseBranchName?: string,
  baseSha?: string,
  buildName?: string,
  buildPriority?: string,
  bulkId?: string,
  buildVariables?: any,
};

export interface WebhookRequestData {
  webhooktype: string,
  event: string,
  giturl: string,
  uuid?: string,
  body?: any,
  user?: any,
  sender?: any
};

export interface Project {
  slack: any,
  name: string,
  deploymentsDisabled: number,
  openshift: any,
  productionEnvironment?: string
};
