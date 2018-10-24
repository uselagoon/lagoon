import React from 'react';
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default App => props => (
  <App
    {...props}
    auth={{
      apiToken: publicRuntimeConfig.GRAPHQL_API_TOKEN,
      authenticated: true,
      logout: () => {},
      provider: 'local-auth',
      providerData: {},
      user: {
        username: 'localadmin',
      },
    }}
  />
);
