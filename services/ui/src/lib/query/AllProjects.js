import gql from 'graphql-tag';

export default gql`
  {
    allProjects {
      id
      name
      environments(type: PRODUCTION) {
        route
      }
    }
  }
`;
