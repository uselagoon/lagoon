import 'isomorphic-unfetch';
import App, { Container, createUrl } from 'next/app';
import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import Typekit from 'react-typekit';
import withAuth, { AuthContext } from '../lib/withAuth';
import ApiConnection from '../lib/ApiConnection';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

class MyApp extends App {
  render() {
    const { router, Component, pageProps, auth } = this.props;
    const url = createUrl(router)
    return (
      <Container>
        <Head>
          <link rel="stylesheet" href="/static/normalize.css" />
          <Typekit kitId="ggo2pml" />
          <script
            type="text/javascript"
            src={`${publicRuntimeConfig.KEYCLOAK_API}/js/keycloak.js`}
          />
        </Head>
        <AuthContext.Provider value={auth}>
          <ApiConnection>
            <Component {...pageProps} url={url} />
          </ApiConnection>
        </AuthContext.Provider>
      </Container>
    );
  }
}

MyApp.displayName = 'withAuth(MyApp)';

export default withAuth(MyApp);
