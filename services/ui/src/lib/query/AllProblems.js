import gql from 'graphql-tag';
import ProblemsFragment from 'lib/fragment/Problem';

export default gql`
  query getAllProblemsQuery($project: Int, $environment: Int!, $identifier: String, $severity: [ProblemSeverityRating]) {
    problems: allProblems(project: $project, environment: $environment, identifier: $identifier, severity: $severity) {
        identifier
        projects {
          id
          name
          gitUrl
        }
        problems {
          ...problemFields
        }
    }
  }
  ${ProblemsFragment}
`;
