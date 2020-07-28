import gql from 'graphql-tag';

export default gql`
  query getAllProblemsQuery($source: [String], $project: Int, $environment: Int, $envType: [EnvType], $identifier: String, $severity: [ProblemSeverityRating]) {
    problems: allProblems(source: $source , project: $project, environment: $environment, identifier: $identifier, envType: $envType, severity: $severity) {
      id
      identifier
      environment {
        id
        name
        environmentType
        openshiftProjectName
        project {
          id
          name
          problemsUi
        }
      }
      data
      severity
      source
      service
      created
      deleted
      severityScore
      associatedPackage
      description
      version
      fixedVersion
      links
    }
  }
`;