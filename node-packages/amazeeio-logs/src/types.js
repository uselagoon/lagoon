// @flow

/**
 * Payload related types for RabbitMQ
 */

export type ChannelWrapper = {
  publish: (exchange: string, routingKey: string, content: Buffer, options: Object) => void,
}