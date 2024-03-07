import { Project as LagoonProject } from '@lagoon/commons/dist/api';

/**
 * Webhook related types for incoming Events
 */

export interface removeData {
  branch?: string;
  branchName?: string;
  forceDeleteProductionEnvironment?: boolean;
  openshiftProjectName?: string;
  projectName: string;
  pullrequest?: string;
  pullrequestNumber?: number;
  pullrequestTitle?: string;
  type: string;
}

export interface deployData {
  baseBranchName?: string,
  baseSha?: string,
  branchName: string,
  buildName?: string,
  buildPriority?: string,
  buildVariables?: any,
  bulkId?: string,
  bulkName?: string,
  headBranchName?: string,
  headSha?: string,
  projectName: string,
  pullrequestNumber?: number,
  pullrequestTitle?: string,
  pullrequestUrl?: string,
  repoName?: string,
  repoUrl?: string,
  sha?: string,
  sourceType?: string,
  sourceUser?: string,
  type?: string;
}

export interface WebhookRequestData {
  body?: any;
  bulkId?: string,
  bulkName?: string,
  event: string;
  giturl: string;
  sender?: any;
  user?: any;
  uuid?: string;
  webhooktype: string;
};

export type Project = Pick<
  LagoonProject,
  | 'name'
  | 'deploymentsDisabled'
>;
