import gql from 'graphql-tag';
import DeploymentFragment from 'lib/fragment/Deployment';

export default gql`
  subscription subscribeToDeployments($environment: Int!) {
    deploymentChanged(environment: $environment) {
      ...deploymentFields
    }
  }
  ${DeploymentFragment}
`;
