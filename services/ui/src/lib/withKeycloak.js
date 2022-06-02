import React from 'react';
import getConfig from 'next/config';
import { queryStringToObject } from 'lib/util';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default (App, initialAuth) => {
  return class withKeycloak extends React.Component {
    static getInitialProps(ctx) {
      return App.getInitialProps(ctx);
    }

    constructor(props) {
      super(props);
      this.state = { auth: initialAuth };
    }

    async componentDidMount() {
      const keycloak = Keycloak({
        url: publicRuntimeConfig.KEYCLOAK_API,
        realm: 'lagoon',
        clientId: 'lagoon-ui'
      });

      keycloak.onTokenExpired = async () => {
        await keycloak.updateToken();
        this.setAuth(keycloak);
      };

      await keycloak.init({
        checkLoginIframe: false
      });

      if (!keycloak.authenticated) {
        const urlQuery = queryStringToObject(location.search);
        const options = urlQuery.idpHint ? { idpHint: urlQuery.idpHint } : {};

        await keycloak.login(options);
      }

      this.setAuth(keycloak);
    }

    setAuth(keycloak) {
      this.setState({
        auth: {
          apiToken: keycloak.token,
          authenticated: keycloak.authenticated,
          logout: keycloak.logout,
          provider: 'keycloak',
          providerData: keycloak,
          user: {
            username: keycloak.tokenParsed
              ? keycloak.tokenParsed.preferred_username
              : 'unauthenticated'
          }
        }
      });
    }

    render() {
      return <App {...this.props} auth={this.state.auth} />;
    }
  };
};
