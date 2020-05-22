import gql from 'graphql-tag';
import ProblemsFragment from 'lib/fragment/Problem';

export default gql`
  query getAllProblemsQuery($environment: Int) {
    allProblems(environment: $environment) {
      ...problemFields
    }
  }
  ${ProblemsFragment}
`;
