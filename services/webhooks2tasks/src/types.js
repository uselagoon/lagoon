// @flow

/**
 * Webhook related types for incoming Events
 */

export type ChannelWrapper = {
  sendToQueue: (queue: string, content: Buffer, options: Object) => void,
  publish: (exchange: string, routingKey: string, content: Buffer, options: Object) => void,
  ack: (msg: Object) => void,
}

export type removeData = {
  projectName: string,
  branch: ?string,
  pullrequest: ?string,
  type: string,
}

export type deployData = {
  projectName: string,
  branchName: string,
  sha: string
}


export type WebhookRequestData = {
  webhooktype: string,
  event: string,
  giturl: string,
  uuid?: string,
  body?: Object,
};

export type Project = {
  slack: Object,
  name: string,
  openshift: Object,
};

export type RabbitMQMsg = {
  content: Buffer,
  fields: Object,
  properties: Object,
};
