// @flow

import bl from 'bl';
import bufferEq from 'buffer-equal-constant-time';
import extractWebhookData from './extractWebhookData';

import sendToAmazeeioWebhooks from './sendToAmazeeioWebhooks';
import { sendToAmazeeioLogs, initSendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';

import type { Logger } from '@amazeeio/amazeeio-local-logging';

import type { ChannelWrapper } from './types';

initSendToAmazeeioLogs();

type Req = http$IncomingMessage;
type Res = http$ServerResponse;

type Cb = () => void;

type Options = {
  path: string,
  channelWrapper: ChannelWrapper,
};

type Handler = (req: Req, res: Res, logger: Logger, cb: Cb) => void;

export default function createReqHandler(options: Options): Handler {
  const {
    path,
    channelWrapper,
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

        logger.debug("RAW Request data", {
          event: 'raw-request-data',
          uuid,
          data: data.toString(),
        });

        sendToAmazeeioLogs('info', "", uuid, "webhooks:receive",  meta,
          `Received new ${webhooktype} webhook,  event: ${event}, giturl: ${giturl}`
        )

        sendToAmazeeioWebhooks(webhookData, channelWrapper);

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
