// @flow

import React from 'react';
import Helmet from 'react-helmet';
import { Link } from 'react-router';
import Title from 'Title';
import Paragraph from 'Paragraph';

const NotFound = (): React.Element<any> => (
  <div>
    <Helmet title="Page not found" />
    <div>
      <Title>Page not found</Title>
      <Paragraph>
        {"These aren't the droids you're looking for."}
      </Paragraph>
      <Paragraph>
        <Link to="/">Back to the front page</Link>
      </Paragraph>
    </div>
  </div>
);

export default NotFound;
