import React from 'react';
import ErrorPage, {ErrorNoHeader} from 'pages/_error';

const QueryError = ({ error }) => (
  <ErrorPage statusCode={500} errorMessage={error.toString()} />
);

export const QueryNoHeaderError = ({ error }) => (
  <ErrorNoHeader errorMessage={error.toString()} />
);

export default QueryError;