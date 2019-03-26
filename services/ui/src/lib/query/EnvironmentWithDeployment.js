import gql from 'graphql-tag';
import DeploymentFragment from 'lib/fragment/Deployment';

export default gql`
  query getEnvironment($openshiftProjectName: String!, $deploymentName: String!) {
    environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      openshiftProjectName
      project {
        id
        name
      }
      deployments(name: $deploymentName) {
        ...deploymentFields
        buildLog
      }
    }
  }
  ${DeploymentFragment}
`;
