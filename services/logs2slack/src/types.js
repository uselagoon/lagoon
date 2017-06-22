// @flow

/**
 * Webhook related types for incoming Events
 */

export type ChannelWrapper = {
  sendToQueue: (evt: string, data: Buffer, opts: Object) => void,
}

