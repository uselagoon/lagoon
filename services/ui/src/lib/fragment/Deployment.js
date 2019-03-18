import gql from 'graphql-tag';

export default gql`
  fragment deploymentFields on Deployment {
    id
    name
    status
    created
    started
    completed
    environment {
      id
      openshiftProjectName
      project {
        id
        name
      }
    }
  }
`;
