import gql from "graphql-tag";
import BillingModifierFragment from 'lib/fragment/BillingModifier';

export default gql`
  mutation updateBillingModifier($input: UpdateBillingModifierInput!) {
    updateBillingModifier(input: $input){
      ...billingModifierFields
    }
  }
  ${BillingModifierFragment}
`;
