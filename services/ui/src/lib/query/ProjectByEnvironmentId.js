import gql from 'graphql-tag';

export default gql`
  query getProjectByEnvironmentId($id: Int!){
    environmentById(id: $id) {
      id
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
