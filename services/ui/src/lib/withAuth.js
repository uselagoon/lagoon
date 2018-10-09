import React from 'react';
import getConfig from 'next/config';
import withKeycloak from './withKeycloak';
import withLocalAuth from './withLocalAuth';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default App => {
  if (publicRuntimeConfig.GRAPHQL_API_TOKEN) {
    return withLocalAuth(App);
  } else {
    return withKeycloak(App);
  }
};
