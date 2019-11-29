import React from 'react';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';
import ButtonAction from 'components/Button/ButtonAction';

const addRestore = gql`
  mutation addRestore($input: AddRestoreInput!) {
    addRestore(input: $input) {
      id
    }
  }
`;

const Prepare = ({ backupId }) => (
  <Mutation mutation={addRestore} variables={{ input: { backupId } }}>
    {(addRestore, { loading, called, error, data }) => {
      if (error) {
        return (
          <ButtonAction disabled>
            Retrieve failed
          </ButtonAction>
        );
      }

      if (loading || called) {
        return (
          <ButtonAction disabled>
            Retrieving ...
          </ButtonAction>
        );
      }

      return (
        <ButtonAction action={addRestore}>
          Retrieve
        </ButtonAction>
      );
    }}
  </Mutation>
);

export default Prepare;
