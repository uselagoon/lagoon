import gql from 'graphql-tag';

export default gql`
  query advancedTasksForEnvironment(environment: Int!) {
    task_definitions: advancedTasksForEnvironment(environment: $environment) {
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
        confirmationText
        advancedTaskDefinitionArguments {
          id
          name
          displayName
          type
          range
        }
      }
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
        confirmationText
        advancedTaskDefinitionArguments {
          id
          name
          displayName
          type
          range
        }
      }
    }
  }
`;
