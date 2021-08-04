import { setConfig } from 'next/config';
// import config from '../src/next.config';

// Make sure you can use "publicRuntimeConfig" within storybook.
// @TODO: "import config from '../src/next.config'" does not work. Figure out
//   how to re-use the creation of publicRuntimeConfig.
const config = setConfig({
  publicRuntimeConfig: {
    GRAPHQL_API: process.env.GRAPHQL_API,
    GRAPHQL_API_TOKEN: process.env.GRAPHQL_API_TOKEN,
    KEYCLOAK_API: process.env.KEYCLOAK_API,
    LAGOON_UI_ICON: null,
    LAGOON_UI_TASK_BLOCKLIST: [],
  },
  serverRuntimeConfig: {},
});

export default config;
