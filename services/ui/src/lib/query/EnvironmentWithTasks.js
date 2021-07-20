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
