import React from 'react';
import ErrorPage from 'pages/_error';

export default ({ variables }) => (
  <ErrorPage
    statusCode={404}
    errorMessage={`Organization "${variables.name}" not found`}
  />
);
