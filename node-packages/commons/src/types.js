// @flow

/**
 * Payload related types for RabbitMQ
 */

export type ChannelWrapper = {
  sendToQueue: (queue: string, content: Buffer, options: Object) => void,
  publish: (
    exchange: string,
    routingKey: string,
    content: Buffer,
    options: Object,
  ) => void,
  ack: (msg: Object) => void,
};

export type Project = {
  slack: Object,
  name: string,
  openshift: Object,
};

export type GroupPatch = {
  name: ?string,
};

export type UserPatch = {
  email: ?string,
  firstName: ?string,
  lastName: ?string,
  comment: ?string,
  gitlabId: ?number,
};

export type ProjectPatch = {
  name: ?string,
  giturl: ?string,
  subfolder: ?string,
  activesystemsdeploy: ?string,
  activesystemsremove: ?string,
  branches: ?string,
  productionenvironment: ?string,
  autoidle: ?number,
  storagecalc: ?number,
  pullrequests: ?string,
  openshift: ?number,
  openshiftprojectpattern: ?string,
};

export type DeploymentPatch = {
  name: number,
  status: string,
  created: string,
  started: string,
  completed: string,
  environment: number,
  remoteId: string,
};

export type TaskPatch = {
  name: ?number,
  status: ?string,
  created: ?string,
  started: ?string,
  completed: ?string,
  environment: ?number,
  remoteId: ?string,
};

export type RestorePatch = {
  status: ?string,
  created: ?string,
  restoreLocation: ?string,
};
