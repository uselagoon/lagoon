import 'isomorphic-unfetch';
import App, { Container } from 'next/app'
import React from 'react'
import { ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-boost';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  headers: {
    authorization: 'Bearer {token}',
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
