// @flow

/**
 * Payload related types for amazee.io api
 */

export type ChannelWrapper = {
  sendToQueue: (queue: string, content: Buffer, options: Object) => void,
  publish: (exchange: string, routingKey: string, content: Buffer, options: Object) => void,
  ack: (msg: Object) => void,
}