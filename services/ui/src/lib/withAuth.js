import React from 'react';
import getConfig from 'next/config';
import withKeycloak from './withKeycloak';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default App => {
  return withKeycloak(App);
};
