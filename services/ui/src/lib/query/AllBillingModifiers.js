import gql from 'graphql-tag';

export default gql`
  query allBillingModifiers($input:GroupInput!){
    allBillingModifiers(input: $input){
      id, 
      group {
        id
        name
      },
      startDate, 
      endDate, 
      discountFixed,
      discountPercentage,
      extraFixed,
      extraPercentage,
      min,
      max,
      customerComments,
      adminComments,
      weight
    }
  }
`;
