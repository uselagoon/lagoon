/**
 * Webhook related types for incoming Events
 */

export interface WebhookRequestData {
  webhooktype: string,
  event: string,
  giturl?: string,
  uuid?: string,
  body?: Object,
};

// See: https://developer.github.com/v3/activity/events/types/#pushevent
export interface GithubPushEvent {
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

// See: https://docs.gitea.io/en-us/webhooks/
export interface GiteaPushEvent {
  event: 'push',
  webhooktype: 'gitea',
  uuid: string,
  body: {
    repository: {
      ssh_url: string,
    },
    ref: string,
    after: string,
  },
};

// See: https://developer.github.com/v3/activity/events/types/#pullrequestevent
export interface GithubPullRequestEvent {
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

// See: https://docs.gitea.io/en-us/webhooks/
export interface GiteaPullRequestEvent {
  event: 'pull_request',
  webhooktype: 'gitea',
  uuid: string,
  body: {
    action: string,
    repository: {
      ssh_url: string,
    },
    number: number,
  }
};

// See: https://developer.github.com/v3/activity/events/types/#deleteevent
export interface GithubDeleteEvent {
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

// See: https://docs.gitea.io/en-us/webhooks/
export interface GiteaDeleteEvent {
  event: 'delete',
  webhooktype: 'gitea',
  uuid: string,
  body: {
    ref_type: string,
    repository: {
      ssh_url: string,
    }
  }
};

export interface CustomPushEvent {
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

export interface PayloadData {
  giturl: string,
  branch?: string,
  sha?: string,
};

// Plain event data, which will also be sent to RabbitMQ
export type RawData =
  GithubPushEvent
  | GithubPullRequestEvent
  | GithubDeleteEvent
  | GiteaPushEvent
  | GiteaPullRequestEvent
  | GiteaDeleteEvent
  | CustomPushEvent
  | any;

// A payload we want to send to RabbitMQ
export type Payload = PayloadData & {
  raw: RawData, // the original input we received from the webhook
};
