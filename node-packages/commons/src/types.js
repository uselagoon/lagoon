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

export type CustomerPatch = {
  name: ?string,
  comment: ?string,
  privateKey: ?string,
  created: ?string,
};
