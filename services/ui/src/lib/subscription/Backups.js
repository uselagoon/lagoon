import gql from 'graphql-tag';
import BackupFragment from 'lib/fragment/Backup';

export default gql`
  subscription subscribeToBackups($environment: Int!) {
    backupChanged(environment: $environment) {
      ...backupFields
    }
  }
  ${BackupFragment}
`;
