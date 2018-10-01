import React from 'react';
import getConfig from 'next/config';
import ApolloClient from 'apollo-boost';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default App => {
  return class withApollo extends React.Component {
    render() {
      let client;

      if (this.props.keycloak) {
        client = new ApolloClient({
          uri: publicRuntimeConfig.GRAPHQL_API,
          headers: {
            authorization: `Bearer ${this.props.keycloak.token}`
          }
        });
      }

      return <App {...this.props} apolloClient={client} />;
    }
  };
};
