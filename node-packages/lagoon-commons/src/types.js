// @flow

/**
 * Payload related types for RabbitMQ
 */

export type ChannelWrapper = {
  sendToQueue: (queue: string, content: Buffer, options: Object) => void,
  publish: (exchange: string, routingKey: string, content: Buffer, options: Object) => void,
  ack: (msg: Object) => void,
}

export type SiteGroup = {
  slack: Object,
  siteGroupName: string,
  openshift: Object,
};