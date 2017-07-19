// @flow

import React from 'react';
import Helmet from 'react-helmet';
import Title from 'Title';
import DeployForm from 'DeployForm';
import RemoveForm from 'RemoveForm';

const Home = (): React.Element<any> => (
  <div>
    <Helmet title="lagoon Hacky UI" />
    <Title>lagoon Hacky UI</Title>
    <DeployForm />
    <RemoveForm />
  </div>
);

export default Home;
