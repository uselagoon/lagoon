// @flow

import uuid4 from 'uuid4';
import url from 'url';

import type { WebhookRequestData } from './types';

type Req = {
  method: string,
  url: string,
  headers: {[key: string]: string },
};

/**
 * This function will check request headers for
 * service specific data like github / gitlab / etc.
 * if the request method is POST.
 *
 * Will eventually generate 'custom' webhook data on
 * GET requests.
 *
 * Will throw an error on malformed request headers,
 * non-json body data or unsupported method.
 */
export default function extractWebhookData(req: Req, body?: string): WebhookRequestData {
  const {
    method,
    headers,
  } = req;

  const parameters = {};
  let webhooktype;
  let event;
  let uuid;
  let bodyObj;
  let giturl;

  if (method === 'POST') {

    try {
      bodyObj = (body == null || body === '') ? {} : JSON.parse(body);
    } catch(e) {
      throw new Error(`request body is not parsable as JSON: ${e}`);
    }

    if ('x-github-event' in req.headers) {
      webhooktype = 'github'
      event = req.headers['x-github-event']
      uuid = req.headers['x-github-delivery']
      giturl = bodyObj.repository.ssh_url
    } else if ('x-gitlab-event' in req.headers) {
      webhooktype = 'gitlab'
      event = req.headers['x-gitlab-event']
    } else if ('x-event-key' in req.headers) {
      webhooktype = 'bitbucket'
      event = req.headers['x-event-key']
      uuid = req.headers['x-request-uuid']
      giturl = 'git@bitbucket.org/' + bodyObj.repository.full_name.toLowerCase() + '.git'
    } else {
      throw new Error('No supported event header found on POST request')
    }


   } else if (method === 'GET') {
    try {
      webhooktype = 'custom';
      event = 'push';
      uuid = uuid4();

      const parsedUrl = url.parse(req.url, true); // true to get query as object
      const { query = {} } = parsedUrl;

      const getParam = (name: string): string => {
        const value = query[name];
        if (value == null) {
          throw new Error(`Query param '${name}' not found!`);
        }
        if (value === '') {
          throw new Error(`Query param '${name}' is empty!`);
        }
        return value;
      };

      parameters.url = getParam('url');
      parameters.branch = getParam('branch');
      parameters.sha = getParam('sha') || '';
      bodyObj = parameters;
    } catch (e) {
      throw new Error(`Error in handling GET request: ${e.message}`);
    }
  }
  else {
    throw new Error(`Unsupported request method: ${method}`);
  }

  const ret: WebhookRequestData = {
    webhooktype: webhooktype,
    event: event,
    giturl: giturl,
    body: bodyObj,
  };

  if (uuid != null) {
    ret.uuid = uuid;
  }


  return ret;
}
