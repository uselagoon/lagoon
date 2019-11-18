import React from 'react';
import ErrorPage from 'pages/_error';

export default ({ error }) => (
  <ErrorPage statusCode={500} errorMessage={error.toString()} />
);
