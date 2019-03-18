import gql from 'graphql-tag';

export default gql`
  fragment backupFields on Backup {
    id
    source
    backupId
    created
    deleted
    restore {
      id
      status
      restoreLocation
    }
  }
`;
