import gql from 'graphql-tag';
import FactsFragment from 'lib/fragment/Fact';

export default gql`
  query getEnvironment($openshiftProjectName: String!) {
    environment: environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      created
      updated
      deployType
      environmentType
      route
      routes
      openshiftProjectName
      services {
        id
        name
      }
      facts {
        ...factFields
      }
      project {
        name
        gitUrl
        productionRoutes
        standbyRoutes
        productionEnvironment
        standbyProductionEnvironment
        problemsUi
        factsUi
      }
    }
  }
  ${FactsFragment}
`;
