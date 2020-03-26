import gql from "graphql-tag";

export default gql`
  fragment billingModifierFields on BillingModifier {
    id, 
    group { id, name, type }, 
    startDate, 
    endDate, 
    discountFixed, 
    discountPercentage, 
    extraFixed, 
    extraPercentage, 
    customerComments, 
    adminComments 
  }
`;