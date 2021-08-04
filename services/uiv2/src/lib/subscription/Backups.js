import gql from 'graphql-tag';

export default gql`
  subscription subscribeToBackups($environment: Int!) {
    backupChanged(environment: $environment) {
      id
      source
      backupId
      created
      restore {
        id
        status
        restoreLocation
      }
    }
  }
`;
