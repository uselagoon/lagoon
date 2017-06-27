// @flow

import React from 'react';
import Helmet from 'react-helmet';
import Title from 'Title';
import DeployForm from 'DeployForm';

const Home = (): React.Element<any> => (
  <div>
    <Helmet title="laggon Hacky UI" />
    <Title>laggon Hacky UI</Title>
    <DeployForm />
  </div>
);

export default Home;
