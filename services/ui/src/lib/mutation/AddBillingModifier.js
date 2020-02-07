import gql from "graphql-tag";
import BillingModifierFragment from 'lib/fragment/BillingModifier';

export default gql`
  mutation addBillingModifier( $input: AddBillingModifierInput!) {
    addBillingModifier(input: $input){
      ...billingModifierFields
    }
  }
  ${BillingModifierFragment}
`;