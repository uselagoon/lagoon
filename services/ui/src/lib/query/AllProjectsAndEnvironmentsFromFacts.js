import gql from 'graphql-tag';

export default gql`
  query projectsByFactSearch($input: FactFilterInput) {
    projectsByFactSearch(input: $input) {
      id
      name
      created
      gitUrl
      environments {
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
      }
    }
  }
`;