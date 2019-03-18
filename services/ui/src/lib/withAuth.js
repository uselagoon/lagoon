import React from 'react';
import getConfig from 'next/config';
import withKeycloak from 'lib/withKeycloak';
import withLocalAuth from 'lib/withLocalAuth';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

const initialAuth = { authenticated: false };

export const AuthContext = React.createContext(initialAuth);

export default App => {
  if (publicRuntimeConfig.GRAPHQL_API_TOKEN) {
    return withLocalAuth(App, initialAuth);
  } else {
    return withKeycloak(App, initialAuth);
  }
};
