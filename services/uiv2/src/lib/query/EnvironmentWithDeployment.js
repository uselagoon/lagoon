import gql from 'graphql-tag';

export default gql`
  query getEnvironment($openshiftProjectName: String!, $deploymentName: String!) {
    environment: environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      openshiftProjectName
      project {
        name
        problemsUi
        factsUi
      }
      deployments(name: $deploymentName) {
        id
        name
        status
        created
        started
        completed
        buildLog
      }
    }
  }
`;
