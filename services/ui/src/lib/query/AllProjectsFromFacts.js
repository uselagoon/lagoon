import gql from 'graphql-tag';

export default gql`
  query projectsByFactSearch($input: FactFilterInput) {
    projectsByFactSearch(input: $input) {
      count
      projects {
        id
        name
        created
        gitUrl
        environments(factFilter: $input) {
          id
          name
          route
          openshiftProjectName
          environmentType
          deployments {
            id
            name
            status
            created
            completed
          }
          facts(keyFacts: true) {
            id
            name
            value
            source
            keyFact
            category
            type
            references {
              id
              fid
              name
            }
          }
        }
      }
    }
  }
`;