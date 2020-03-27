import gql from "graphql-tag";

export default gql`
  mutation deleteBillingModifier( $input: DeleteBillingModifierInput!) {
    deleteBillingModifier(input: $input)
  }
`;