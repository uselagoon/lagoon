import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import StatusLayout from 'layouts/StatusLayout';
import { LoadingSpinner } from 'components/Loading';

const statusCodes = {
  400: 'Bad Request',
  401: 'Not Authenticated',
  404: 'This page could not be found',
  500: 'Internal Server Error',
  501: 'Not Implemented'
};

/**
 * Displays an error page, given a status code and optional error message.
 */
export const Error = ({ statusCode, errorMessage }) => {
  const displayName = 'ErrorPage';
  const title = statusCodes[statusCode] || 'An unexpected error has occurred';

  return (
    <StatusLayout>
      <Head>
        <title>
          {statusCode}: {title}
        </title>
      </Head>
      <h2>{title}</h2>
      <LoadingSpinner />
      {errorMessage && <p>{errorMessage}</p>}
    </StatusLayout>
  );

}

export const ErrorNoHeader = ({ statusCode, errorMessage }) => {
  const displayName = 'ErrorNoHeader';
  return (errorMessage && <p>{errorMessage}</p>);
}

if (process.env.NODE_ENV !== 'production') {
  Error.propTypes = {
    errorMessage: PropTypes.string,
  };
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error;