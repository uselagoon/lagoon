// @flow

/**
 * Webhook related types for incoming Events
 */

export type WebhookRequestData = {
  webhooktype: string,
  event: string,
  giturl: any,
  uuid?: string,
  body?: Object,
};

export type ChannelWrapper = {
  sendToQueue: (evt: string, data: Buffer, opts: Object) => void,
}

export type GithubPushEvent = {
  event: 'push',
  webhooktype: 'github',
  uuid: string,
  body: {
    repository: {
      ssh_url: string,
    },
    ref: string,
    after: string,
  },
};

export type GithubPullRequestEvent = {
  event: 'pull_request',
  webhooktype: 'github',
  uuid: string,
  body: {
    action: string,
    repository: {
      ssh_url: string,
    },
    number: number,
  }
};

export type GithubDeleteEvent = {
  event: 'delete',
  webhooktype: 'github',
  uuid: string,
  body: {
    ref_type: string,
    repository: {
      ssh_url: string,
      ref_type: string,
    }
  }
};

export type CustomPushEvent = {
  event: 'push',
  webhooktype: 'custom',
  uuid: string,
  parameters: {
    url: string,
    branch: string,
    sha: string,
  },
};

/**
 * Payload related types for RabbitMQ
 */

export type PayloadData = {
  giturl: string,
  branch?: string,
  sha?: string,
};

// Plain event data, which will also be sent to RabbitMQ
export type RawData =
  GithubPushEvent
  | GithubPullRequestEvent
  | GithubDeleteEvent
  | CustomPushEvent;

// A payload we want to send to RabbitMQ
export type Payload = PayloadData & {
  raw: RawData, // the original input we received from the webhook
};
