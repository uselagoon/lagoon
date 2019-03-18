import gql from 'graphql-tag';

export default gql`
  {
    allProjects {
      id
      name
      customer {
        name
      }
      environments(type: PRODUCTION) {
        route
      }
    }
  }
`;
