import gql from 'graphql-tag';

export default gql`
  {
    allProjects {
      id
      name
      created
      gitUrl
      environments {
        name
        route
        environmentType
        facts {
          id
          name
          value
          source
          category
          reference
          type
          category
        }
      }
    }
  }
`;
