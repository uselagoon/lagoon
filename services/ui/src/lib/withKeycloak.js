import React from 'react';
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default (App, initialAuth) => {
  return class withKeycloak extends React.Component {
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
        onLoad: 'login-required',
        checkLoginIframe: false
      });

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
            username: keycloak.tokenParsed ? keycloak.tokenParsed.preferred_username : 'unauthenticated',
          },
        }
      });
    }

    render() {
      return <App {...this.props} auth={this.state.auth} />;
    }
  };
};
