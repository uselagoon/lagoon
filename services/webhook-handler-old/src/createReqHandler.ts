import bl from 'bl';
import { IncomingMessage, ServerResponse } from 'http';
import { ChannelWrapper } from 'amqp-connection-manager';
import { extractWebhookData } from './extractWebhookData';

import { sendToLagoonWebhooks } from './sendToLagoonWebhooks';
import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';

import type { Logger } from '@lagoon/commons/dist/logs/local-logger';

interface Callback {
  (): void
}

interface Options {
  path: string,
  channelWrapperWebhooks: ChannelWrapper,
};

// Fix Logger type when this file converts to typescript
type Handler = (req: IncomingMessage, res: ServerResponse, logger: Logger, cb: Callback) => void;

initSendToLagoonLogs();

export function createReqHandler(options: Options): Handler {
  const {
    path,
    channelWrapperWebhooks,
  } = options;

  /**
   * Parses given request for webhook related data and will forward
   * it to given EventEmitter for further computation
   */
  function handler (req, res, logger, cb) {
    if (req.url.split('?').shift() !== path) {
      return cb();
    }

    const endWithError = (msg) => {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: msg }));

      logger.error(`Error: ${msg}`);
    };

    req.pipe(bl((err, data) => {
      if (err) {
        return endWithError(err.message);
      }

      try {
        const { method } = req;

        const webhookData = extractWebhookData(req, data.toString());

        const {
          webhooktype,
          event,
          giturl,
          uuid,
          body,
        } = webhookData;

        const meta = {
          webhooktype: webhooktype,
          event: event,
          giturl: giturl,
          rawbody: data.toString(),
        }
        sendToLagoonLogs('info', "", uuid, "webhooks:receive",  meta,
          `Received new ${webhooktype} webhook,  event: ${event}, giturl: ${giturl}`
        )

        sendToLagoonWebhooks(webhookData, channelWrapperWebhooks);

        res.writeHead(200, { 'content-type': 'application/json' });

        const responseData = JSON.stringify({ data: webhookData }, null, 2)
        res.end(responseData);
      }
      catch(e) {
        return endWithError(e.message);
      }
    }))
  }

  return handler;
}
