import gql from 'graphql-tag';
import ProblemsFragment from 'lib/fragment/Problem';

export default gql`
  query getAllProjectsProblemsQuery($severity: [ProblemSeverityRating], $source: [String], $envType: EnvType) {
    projectsProblems: allProjects {
      id
      name
      environments(type: $envType) {
        id
        name
        problems(severity: $severity, source: $source) {
          ...problemFields
        }
      }
    }
  }
  ${ProblemsFragment}
`;