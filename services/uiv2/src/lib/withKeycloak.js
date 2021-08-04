import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';
import { queryStringToObject } from 'lib/util';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

const withKeycloak = (App, initialAuth) => (props) => {
    const [auth, setAuth] = useState(initialAuth);

    const updateAuth = (keycloak) => {
      setAuth({
        apiToken: keycloak.token,
        authenticated: keycloak.authenticated,
        logout: keycloak.logout,
        provider: 'keycloak',
        providerData: keycloak,
        user: {
          username: keycloak.tokenParsed ? keycloak.tokenParsed.preferred_username : 'unauthenticated',
        }
      });
    }

    useEffect(async () => {
      const keycloak = Keycloak({
        url: publicRuntimeConfig.KEYCLOAK_API,
        realm: 'lagoon',
        clientId: 'lagoon-ui'
      });

      keycloak.onTokenExpired = async () => {
        await keycloak.updateToken();
        updateAuth(keycloak);
      };

      await keycloak.init({
        checkLoginIframe: false,
        promiseType: 'native',
      });

      if (!keycloak.authenticated) {
        const urlQuery = queryStringToObject(location.search);
        const options = urlQuery.idpHint ? { idpHint: urlQuery.idpHint } : {};

        await keycloak.login(options);
      }

      updateAuth(keycloak);
    }, []);

    return <App {...props} auth={auth} />;
};

withKeycloak.getInitialProps = ({ ctx }) => {
  return App.getInitialProps(ctx);
}

export default withKeycloak;