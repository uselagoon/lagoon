import gql from 'graphql-tag';

export default gql`
  {
    allGroups {
      name
      projects {
        name
        id
        environments(type: PRODUCTION) {
          name
          id
          problems {
            id
            identifier
            severity
            source
          }
        }
      }
    }
  }
`;
