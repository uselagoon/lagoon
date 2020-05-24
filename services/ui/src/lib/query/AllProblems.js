import gql from 'graphql-tag';
import ProblemsFragment from 'lib/fragment/Problem';

export default gql`
  query getAllProblemsQuery($project: Int, $environment: Int!, $severity: [ProblemSeverityRating]) {
    problems: allProblems(project: $project, environment: $environment, severity: $severity) {
      ...problemFields
    }
    environment: environmentById(id: $environment) {
      id
      name
      openshiftProjectName
      project {
        id
        name
      }
      problems {
        ...problemFields
      }
    }
  }
  ${ProblemsFragment}
`;
