import gql from 'graphql-tag';
import ProblemsFragment from 'lib/fragment/Problem';

export default gql`
  query getEnvironment($openshiftProjectName: String!) {
    environment: environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      openshiftProjectName
      project {
        id
        name
        problemsUi
        factsUi
      }
      problems {
        ...problemFields
      }
    }
  }
  ${ProblemsFragment}
`;
