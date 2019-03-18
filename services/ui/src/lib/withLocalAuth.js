import React from 'react';
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

export default (App, initialAuth) => {
  return class withLocalAuth extends React.Component {
    static getInitialProps(ctx) {
      return App.getInitialProps(ctx);
    }

    render() {
      return (
        <App
          {...this.props}
          auth={{
            apiToken: publicRuntimeConfig.GRAPHQL_API_TOKEN,
            authenticated: true,
            logout: () => {},
            provider: 'local-auth',
            providerData: {},
            user: {
              username: 'localadmin'
            }
          }}
        />
      );
    }
  };
};
