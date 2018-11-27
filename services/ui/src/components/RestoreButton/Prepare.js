import React from 'react';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';

const addRestore = gql`
  mutation addRestore($input: AddRestoreInput!) {
    addRestore(input: $input) {
      id
    }
  }
`;

const Prepare = ({ backupId, className }) => (
  <Mutation mutation={addRestore}>
    {(addRestore, { loading, called, error, data }) => {
      if (error) {
        return <button className={className} disabled>Download error</button>;
      }

      if (called) {
        return <button className={className} disabled>Preparing ...</button>;
      }

      return (
        <button
          className={className}
          onClick={() => {
            addRestore({ variables: { input: { backupId } } });
          }}
        >
          Prepare download
        </button>
      );
    }}
  </Mutation>
);

export default Prepare;
