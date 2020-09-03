import gql from 'graphql-tag';
import ProblemsFragment from 'lib/fragment/Problem';

export default gql`
  query getAllProblemsByProjectQuery($name: String!, $severity: [ProblemSeverityRating], $source: [String], $envType: EnvType) {
    project: projectByName(name: $name) {
      id
      name
      openshiftProjectName
      problemsUi
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