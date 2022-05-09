import gql from 'graphql-tag';

export default gql`
  query getEnvironment($openshiftProjectName: String!, $taskName: String!) {
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
      tasks(taskName: $taskName) {
        name
        taskName
        status
        created
        service
        logs
        files {
          id
          filename
          download
        }
      }
    }
  }
`;
