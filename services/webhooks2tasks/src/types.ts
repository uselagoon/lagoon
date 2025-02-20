import { Project as LagoonProject } from '@lagoon/commons/dist/api';

/**
 * Webhook related types for incoming Events
 */

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
