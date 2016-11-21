// @flow

import { take, put, go, chan, takeAsync } from 'js-csp';
import { contains } from 'ramda';
import gql from '../gql';
import {
  effectHandler,
  stdoutEffect,
  stderrEffect,
  gqlEffect,
  stateEffect,
  connectPut,
} from '../effects';

import typeof { Channel } from 'js-csp/es/impl/channels';
import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';

const name = 'list';
const description = 'Lists specific deployment information';

export async function setup(yargs: Yargs) {
  return yargs
    .usage(`$0 ${name} [target] - ${description}`)
    .options({
      sitegroup: {
        alias: 's',
        demand: false,
        describe: 'Overrides the currently configured sitegroup (.amazeeio.yml)',
      },
    })
    .example(`$0 ${name} sites`, 'Lists all sites for the specific sitegroup configured in your .amazeeio.yml config file')
    .example(`$0 ${name} sites -s mysitegroup`, 'Lists all sites for a specific sitegroup (instead of using the config file)')
    .argv;
}


function resolveChannel(channel: Channel): Promise<number> {
  return new Promise((res, rej) => {
    takeAsync(channel, (val) => res(val));
  });
}

type Args = BaseArgs & {
  sitegroup: ?string,
  target: string,
};

export async function run(args: Args): Promise<number> {
  const mainArgs = {
    sitegroup: args.sitegroup || args.config.sitegroup,
    target: args.target,
  };

  const end = go(main, [mainArgs]);

  return resolveChannel(end);
}

type MainArgs = {
  sitegroup: string,
  target: string,
};

export function* main(args: MainArgs): Generator<*, *, *> {
  const input = chan();
  const out = chan();

  // Runs the effect-handler as long as input is open
  go(effectHandler, [input, out]);

  const log = connectPut(input, stdoutEffect);
  const logErr = connectPut(input, stderrEffect);
  const gqlQuery = connectPut(input, gqlEffect);
  const getState = connectPut(input, stateEffect);

  const {
    sitegroup,
    target,
  } = args;

  if (!contains(target, ['sites'])) {
    yield logErr(`Unknown target ${target}`);
    input.close();
    return 1;
  }

  const query = gql`query myQuery($sitegroup: String!) {
    siteGroupByName(name: $sitegroup) {
      gitUrl
      sites(first: 1000) {
        edges {
          node {
            siteName
            siteBranch
            siteEnvironment
            siteHost
            serverInfrastructure
            serverIdentifier
            serverNames
          }
        }
      }
    }
  }`;

  yield gqlQuery(query, { sitegroup });
  const result = yield take(out);

  yield log(result);

  yield getState(0);
  const { code, stack } = yield take(out);

  yield log(`State code: ${code}`);
  yield log(stack);

  input.close();
  return code;
}

export default {
  name,
  description,
  run,
};
