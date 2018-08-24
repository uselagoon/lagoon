import 'isomorphic-unfetch';
import App, { Container } from 'next/app'
import React from 'react'
import getConfig from 'next/config'
import { ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-boost';

const {serverRuntimeConfig, publicRuntimeConfig} = getConfig()

const client = new ApolloClient({
  uri: publicRuntimeConfig.API,
  headers: {
    authorization: `Bearer ${publicRuntimeConfig.API_TOKEN}`,
  },
});

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return <Container>
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
    </Container>
  }
}

export default MyApp
