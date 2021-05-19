export class ProblemsHarborConnectionError extends Error {
    constructor(message) {
      super(message);
      this.name = 'problems-harborConnectionError';
    }
  }

export class ProblemsInvalidWebhookData extends Error {
    constructor(message) {
      super(message);
      this.name = 'problems-invalidWebhookData';
    }
}

