// @flow

/**
 * Webhook related types for incoming Events
 */

export type ChannelWrapper = {
  ack: any,
  sendToQueue: (evt: string, data: Buffer, opts: Object) => void
};
