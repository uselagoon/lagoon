import gql from 'graphql-tag';

export default gql`
  query getOrganization($id: Int!){
    organization: organizationById (organization: $id){
      id
      name
      description
      quotaProject
      deployTargets{
        id
        name
        friendlyName
        cloudProvider
        cloudRegion
      }
      owners {
        email
      }
      projects {
        id
        name
        groups {
          type
          id
          name
        }
      }
      groups {
        id
        name
        type
        members {
          role
          user {
            email
            comment
          }
          role
        }
      }
    }
  }
`;
