import React from 'react';
import getConfig from 'next/config';
import ApolloClient from 'apollo-boost';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default App => {
  return class withApollo extends React.Component {
    constructor(props) {
      super(props);
      this.state = { client: undefined };
    }

    componentDidMount() {
      this.createClient();
    }

    componentDidUpdate() {
      this.createClient();
    }

    createClient() {
      if (this.props.keycloak && !this.state.client) {
        const client = new ApolloClient({
          uri: publicRuntimeConfig.GRAPHQL_API,
          headers: {
            authorization: `Bearer ${this.props.keycloak.token}`
          }
        });
        this.setState({ client })
      }
    }

    render() {
      return <App {...this.props} apolloClient={this.state.client} />;
    }
  };
};
