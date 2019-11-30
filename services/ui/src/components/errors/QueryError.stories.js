import React from 'react';
import QueryError from './QueryError';

export default {
  component: QueryError,
  title: 'Components/Errors/QueryError',
}

export const Default = () => (
  <QueryError
    error={'Some sort of Query error has occurred.'}
  />
);
