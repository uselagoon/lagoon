import gql from 'graphql-tag';
import AdvancedTaskFragment from 'lib/fragment/AdvancedTask';

export default gql`
  query getEnvironment($openshiftProjectName: String!, $limit: Int) {
    environment: environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      openshiftProjectName
      project {
        name
        problemsUi
        factsUi
      }
      services {
        name
      }
      advancedTasks {
        ...advancedTaskFields
      }
      tasks(limit: $limit) {
        id
        name
        status
        created
        service
      }
    }
  }
  ${AdvancedTaskFragment}
`;
