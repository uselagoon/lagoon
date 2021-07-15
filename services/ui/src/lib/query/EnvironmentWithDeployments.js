import gql from 'graphql-tag';

export default gql`
  query getEnvironment($openshiftProjectName: String!, $limit: Int) {
    environment: environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      openshiftProjectName
      deployType
      deployBaseRef
      deployHeadRef
      deployTitle
      project {
        name
        problemsUi
        factsUi
      }
      deployments(limit: $limit) {
        id
        name
        status
        created
        started
        completed
      }
    }
  }
`;
