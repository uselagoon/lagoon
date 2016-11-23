// @flow

import { takeAsync } from 'js-csp';
import { fromColl } from 'js-csp/lib/csp.operations';

import typeof { Channel } from 'js-csp/es/impl/channels';

// TODO: Make Channel generic, so we at least tell which resolve type Promise yields
export function resolveChannel(channel: Channel, keepOpen?: boolean = false): Promise<mixed|Error> {
  return new Promise((res, rej) => {
    takeAsync(channel, (val) => { 
      res(val);

      if (keepOpen) {
        channel.close();
      }
    });
  });
}

export function maybeResolveChannel(channel: Channel, keepOpen?: boolean = false): Promise<mixed> {
  return new Promise((res, rej) => {
    takeAsync(channel, (val) => { 
      if (val instanceof Error) {
        rej(val);
      }
      else {
        res(val);
      }

      if (keepOpen) {
        channel.close();
      }
    });
  });
}


export function fail(msg: string): Channel {
  return fromColl([new Error(msg)]);
}
