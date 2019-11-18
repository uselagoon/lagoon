import gql from 'graphql-tag';
import BackupsFragment from 'lib/fragment/Backup';

export default gql`
  query getEnvironment($openshiftProjectName: String!) {
    environment: environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      openshiftProjectName
      project {
        id
        name
      }
      backups {
        ...backupFields
      }
    }
  }
  ${BackupsFragment}
`;
