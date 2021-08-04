import gql from 'graphql-tag';

export default gql`
  query allProjectAfterDate($createdAfter: String){
    allProjects(createdAfter: $createdAfter) {
      id
      name
      created
      availability
      # groups {
      #   __typename
      #   name
      #   type
      # }
      environments(includeDeleted: true) {
        id
        name
      }
    }
  }
`;