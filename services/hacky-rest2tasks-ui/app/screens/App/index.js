// @flow

import 'App/styles';

import React from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';
import LoadingIndicator from 'LoadingIndicator';

type AppProps = {
  children: React.Element<any>,
  router: Object,
};

const Wrapper = styled.div`
  max-width: 90rem;
  margin: auto;
  padding: 1rem;
  background-color: lightgrey;
`;

const App = ({ children, router }: AppProps): React.Element<any> => (
  <Wrapper>
    <Helmet
      titleTemplate="laggon Hacky UI - %s"
      defaultTitle="laggon Hacky UI"
    />
    {router && router.loading && <LoadingIndicator />}
    {children}
  </Wrapper>
);

export default App;
