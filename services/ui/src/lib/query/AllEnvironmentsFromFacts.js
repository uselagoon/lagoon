import gql from 'graphql-tag';

export default gql`
  query projectsByFactSearch($input: FactFilterInput) {
    projectsByFactSearch(input: $input) {
      id
      name
      created
      gitUrl
      environments(factFilter: $input) {
        id
        name
        route
        environmentType
        facts {
          id
          name
          value
          source
          keyFact
          category
          type
        }
      }
    }
  }
`;