import gql from 'graphql-tag';

export default gql`
  query getProjectByEnvironmentId($id: Int!) {
    environment: environmentById(id: $id) {
      id
      name
      project {
        name
        openshift {
          name
        }
        gitUrl
      }
    }
  }
`;
