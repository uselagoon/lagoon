import gql from 'graphql-tag';
import FactsFragment from 'lib/fragment/Fact';

export default gql`
  {
    allProjects {
      id
      name
      environments(type: PRODUCTION) {
        name
        route
        routes
        environmentType
        facts {
          ...factFields
        }
        status
      }
    }
  }
  ${FactsFragment}
`;
