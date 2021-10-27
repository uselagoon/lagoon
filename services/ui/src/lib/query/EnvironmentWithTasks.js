import gql from 'graphql-tag';

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
        ... on AdvancedTaskDefinitionCommand {
          id
          type
          name
          description
          environment
          project
          service
          created
          deleted
          advancedTaskDefinitionArguments {
            id
            name
            type
            range
          }
        }
        ... on AdvancedTaskDefinitionImage {
          id
          type
          name
          description
          environment
          project
          service
          created
          deleted
          advancedTaskDefinitionArguments {
            id
            name
            type
            range
          }
        }
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
`;
