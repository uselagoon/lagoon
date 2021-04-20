import gql from 'graphql-tag';
import TaskFragment from 'lib/fragment/Task';
import AdvancedTaskFragment from 'lib/fragment/AdvancedTask';

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
      advancedTasks {
        ...advancedTaskFields
      }
      tasks {
        ...taskFields
      }
    }
  }
  ${AdvancedTaskFragment}
  ${TaskFragment}
`;
