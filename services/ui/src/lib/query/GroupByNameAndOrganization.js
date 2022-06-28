import gql from 'graphql-tag';

export default gql`
  query getGroup($name: String!, $organization: Int!) {
    group: groupByNameAndOrganization(name: $name, organization: $organization){
      id
      name
      type
      members{
        role
        user{
          email
          comment
        }
      }
    }

    organization: organizationById (organization: $organization){
      id
      name
      description
      quotaProject
      deployTargets{
        id
        name
      }
      projects {
        id
        name
      }
    }
  }
`;
