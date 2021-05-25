import gql from 'graphql-tag';

export default gql`
  query environmentsByFactSearch($input: FactFilterInput) {
    environmentsByFactSearch(input: $input) {
      id
      name
      route
      environmentType
      facts {
        id
        name
        value
        source
        reference
        category
        type
      }
      project {
        id
        name
        created
        gitUrl
      }
    }
  }
`;