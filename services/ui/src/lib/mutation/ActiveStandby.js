import gql from "graphql-tag";
import BillingModifierFragment from 'lib/fragment/BillingModifier';

export default gql`
  mutation activeStandby($input: DeployActiveStandbyInput!) {
    deployActiveStandby(input:$input){
      id
      remoteId
    }
  }
`;