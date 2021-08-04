import gql from 'graphql-tag';

export default gql`
  query environmentsByFactSearch($input: FactFilterInput) {
    environmentsByFactSearch(input: $input) {
      count
      environments {
        id
        name
        route
        environmentType
        openshiftProjectName
        project {
          id
          name
          created
          gitUrl
        }
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
`;