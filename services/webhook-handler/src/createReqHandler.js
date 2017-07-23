// @flow

const bl = require('bl');
const { bufferEq } = require('buffer-equal-constant-time');
const { extractWebhookData } = require('./extractWebhookData');

const { sendToAmazeeioWebhooks } = require('./sendToAmazeeioWebhooks');
const { sendToAmazeeioLogs, initSendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');

import type { Logger } from '@amazeeio/lagoon-commons/src/local-logging';
import type { ChannelWrapper } from './types';

type Req = http$IncomingMessage;
type Res = http$ServerResponse;

type Cb = () => void;

type Options = {
  path: string,
  channelWrapperWebhooks: ChannelWrapper,
};

type Handler = (req: Req, res: Res, logger: Logger, cb: Cb) => void;

initSendToAmazeeioLogs();

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

      logger.error('Error:', msg);
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
        console.log(`Calling sendToAmazeeioLogs`)
        sendToAmazeeioLogs('info', "", uuid, "webhooks:receive",  meta,
          `Received new ${webhooktype} webhook,  event: ${event}, giturl: ${giturl}`
        )

        sendToAmazeeioWebhooks(webhookData, channelWrapperWebhooks);

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
