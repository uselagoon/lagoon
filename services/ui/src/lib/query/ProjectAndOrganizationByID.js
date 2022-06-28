import gql from 'graphql-tag';

export default gql`
  query getOrganization($id: Int!){
    organization: organizationById (organization: $id){
      id
      name
      projects {
        id
        name
        groups {
          type
          id
          name
        }
      }
      groups{
        type
        name
      }
    }
  }
`;
