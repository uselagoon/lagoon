import React from 'react';
import getConfig from 'next/config';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { AuthContext } from './withAuth';
import NotAuthenticated from '../components/NotAuthenticated';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default ({ children }) =>
  <AuthContext.Consumer>
    {auth => {
      if (!auth.authenticated) {
        return <NotAuthenticated />;
      }

      const client = new ApolloClient({
        uri: publicRuntimeConfig.GRAPHQL_API,
        headers: {
          authorization: `Bearer ${auth.apiToken}`
        }
      });

      return (
        <ApolloProvider client={client}>
          {children}
        </ApolloProvider>
      );
    }}
  </AuthContext.Consumer>;
