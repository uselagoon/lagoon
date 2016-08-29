// @flow

import typeof { default as Yargs } from 'yargs';
import type { BaseArgs } from './index';
// import Relay from 'react-relay';

const name = 'status';
const description = 'Outputs information about the configured sitegroup';

export async function setup(yargs: Yargs) {
  return yargs
    .usage(`$0 ${name} - ${description}`);
}

type Args = BaseArgs;

export async function run(args: Args): Promise<number> {
  const { sitegroup } = args.config;
  console.log(sitegroup); // eslint-disable-line no-console

  // TODO: Fix the query and try to do the request
  // const q = Relay.QL`query {
    // siteGroupByName(name: "amazee_io"){
      // gitUrl
      // sites {
        // edges {
          // node {
            // siteName
            // siteBranch
            // siteEnvironment
            // siteHost
            // serverInfrastructure
            // serverIdentifier
            // serverNames
          // }
        // }
      // }
    // }
  // }`;

  return 0;
}

export default {
  name,
  description,
  run,
};
