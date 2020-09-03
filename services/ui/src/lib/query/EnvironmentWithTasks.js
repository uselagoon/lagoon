import gql from 'graphql-tag';
import TaskFragment from 'lib/fragment/Task';

export default gql`
  query getEnvironment($openshiftProjectName: String!) {
    environment: environmentByOpenshiftProjectName(
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
        problemsUi
        factsUi
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
