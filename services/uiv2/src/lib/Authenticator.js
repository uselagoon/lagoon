import React from 'react';
import getConfig from 'next/config';
import withKeycloak from 'lib/withKeycloak';
import withLocalAuth from 'lib/withLocalAuth';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

const initialAuth = { authenticated: false };

export const AuthContext = React.createContext(initialAuth);

const ContextProvider = ({ children, auth }) => (
  <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
);

const Authenticator = publicRuntimeConfig.GRAPHQL_API_TOKEN
  ? withLocalAuth(ContextProvider, initialAuth)
  : withKeycloak(ContextProvider, initialAuth);

export default Authenticator;
