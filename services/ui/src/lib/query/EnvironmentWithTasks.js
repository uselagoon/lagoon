import gql from 'graphql-tag';
import TaskFragment from 'lib/fragment/Task';

export default gql`
  query getEnvironment($openshiftProjectName: String!) {
    environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      created
      updated
      deployType
      environmentType
      routes
      openshiftProjectName
      project {
        id
        name
      }
      services {
        id
        name
      }
      tasks {
        ...taskFields
      }
    }
  }
  ${TaskFragment}
`;
